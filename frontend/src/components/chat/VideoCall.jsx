import { useCallback, useEffect, useRef, useState } from "react";
import socket from "../../socket";

const CALL_TIMEOUT = 30000;

/*
 * WebRTC ICE configuration.
 *
 * STUN helps discover the public network address.
 *
 * TURN is strongly recommended for users behind:
 * - mobile networks
 * - CGNAT
 * - strict Wi-Fi
 * - corporate networks
 * - symmetric NAT
 *
 * Add TURN values to your Vite environment later:
 *
 * VITE_TURN_URL
 * VITE_TURN_USERNAME
 * VITE_TURN_CREDENTIAL
 */

const RTC_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun.cloudflare.com:3478",
        "stun:stun.nextcloud.com:443",
      ],
    },

    ...(import.meta.env.VITE_TURN_URL
      ? [
          {
            urls: import.meta.env.VITE_TURN_URL,
            username:
              import.meta.env.VITE_TURN_USERNAME || "",
            credential:
              import.meta.env.VITE_TURN_CREDENTIAL || "",
          },
        ]
      : []),
  ],

  iceCandidatePoolSize: 10,
};

function mediaError(error) {
  if (!error) {
    return "Unable to access camera or microphone.";
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera/microphone permission was denied. Please allow access and try again.";

    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone was found.";

    case "NotReadableError":
    case "TrackStartError":
      return "Your camera or microphone is being used by another application.";

    case "SecurityError":
      return "Camera and microphone require HTTPS.";

    case "OverconstrainedError":
      return "The selected camera or microphone settings are not available.";

    default:
      return (
        error.message ||
        "Unable to access your camera or microphone."
      );
  }
}

export default function VideoCall({
  conversationId,
  otherUserId,
  otherUserName = "PropertyNestHomes User",
}) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const peer = useRef(null);
  const localStream = useRef(null);

  /*
   * ICE candidates can arrive before the remote description.
   * Store them temporarily and apply them after setRemoteDescription().
   */
  const pendingCandidates = useRef([]);

  const callTimer = useRef(null);
  const mounted = useRef(false);

  const stateRef = useRef("idle");

  const [state, setState] = useState("idle");
  const [incoming, setIncoming] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /*
   * ----------------------------------------------------------
   * TIMER
   * ----------------------------------------------------------
   */

  const clearTimer = useCallback(() => {
    if (callTimer.current) {
      clearTimeout(callTimer.current);
      callTimer.current = null;
    }
  }, []);

  /*
   * ----------------------------------------------------------
   * LOCAL MEDIA
   * ----------------------------------------------------------
   */

  const stopStream = useCallback(() => {
    if (!localStream.current) {
      return;
    }

    localStream.current.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    localStream.current = null;

    if (localVideo.current) {
      localVideo.current.srcObject = null;
    }
  }, []);

  const getStream = useCallback(async () => {
    if (localStream.current) {
      return localStream.current;
    }

    if (!window.isSecureContext) {
      throw new Error(
        "Camera and microphone require a secure HTTPS connection."
      );
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera and microphone are not supported by this browser."
      );
    }

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },

        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

    localStream.current = stream;

    if (localVideo.current) {
      localVideo.current.srcObject = stream;

      try {
        await localVideo.current.play();
      } catch {}
    }

    return stream;
  }, []);

  /*
   * ----------------------------------------------------------
   * PEER CONNECTION CLEANUP
   * ----------------------------------------------------------
   */

  const closePeer = useCallback(() => {
    if (peer.current) {
      try {
        peer.current.onicecandidate = null;
        peer.current.ontrack = null;
        peer.current.onconnectionstatechange = null;
        peer.current.oniceconnectionstatechange = null;
        peer.current.onicegatheringstatechange = null;
        peer.current.close();
      } catch {}
    }

    peer.current = null;

    pendingCandidates.current = [];

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
  }, []);

  /*
   * ----------------------------------------------------------
   * RESET
   * ----------------------------------------------------------
   */

  const resetCall = useCallback(
    (notifyUser = false, targetId = null) => {
      clearTimer();

      const target =
        targetId || otherUserId;

      if (
        notifyUser &&
        target &&
        socket.connected
      ) {
        socket.emit("endCall", {
          targetUserId: Number(target),
          conversationId: Number(conversationId),
        });
      }

      closePeer();
      stopStream();

      setIncoming(null);
      setState("idle");
    },
    [
      clearTimer,
      closePeer,
      stopStream,
      otherUserId,
      conversationId,
    ]
  );

  /*
   * ----------------------------------------------------------
   * CREATE WEBRTC PEER
   * ----------------------------------------------------------
   */

  const createPeer = useCallback(
    (targetUserId) => {
      if (peer.current) {
        return peer.current;
      }

      console.log(
        "🧊 Creating RTCPeerConnection:",
        RTC_CONFIG
      );

      const connection =
        new RTCPeerConnection(
          RTC_CONFIG
        );

      /*
       * Send ICE candidates to the other user.
       */
      connection.onicecandidate = (
        event
      ) => {
        if (!event.candidate) {
          return;
        }

        if (!socket.connected) {
          console.warn(
            "⚠️ Socket disconnected while sending ICE candidate"
          );
          return;
        }

        console.log(
          "🧊 Sending ICE candidate to:",
          targetUserId
        );

        socket.emit("iceCandidate", {
          targetUserId: Number(
            targetUserId
          ),

          candidate: event.candidate,

          conversationId: Number(
            conversationId
          ),
        });
      };

      /*
       * Useful diagnostics.
       */
      connection.onicegatheringstatechange =
        () => {
          console.log(
            "🧊 ICE gathering:",
            connection.iceGatheringState
          );
        };

      connection.oniceconnectionstatechange =
        () => {
          console.log(
            "🧊 ICE connection:",
            connection.iceConnectionState
          );

          if (
            connection.iceConnectionState ===
            "connected"
          ) {
            console.log(
              "✅ ICE connection established"
            );
          }

          if (
            connection.iceConnectionState ===
            "completed"
          ) {
            console.log(
              "✅ ICE connection completed"
            );
          }

          if (
            connection.iceConnectionState ===
            "failed"
          ) {
            console.error(
              "❌ ICE connection failed"
            );

            if (mounted.current) {
              setError(
                "Network connection failed. A TURN server may be required for this network."
              );
            }
          }

          if (
            connection.iceConnectionState ===
            "disconnected"
          ) {
            console.warn(
              "⚠️ ICE connection disconnected"
            );
          }
        };

      /*
       * Receive remote video/audio.
       */
      connection.ontrack = (event) => {
        console.log(
          "🎥 Remote media received"
        );

        const stream =
          event.streams?.[0];

        if (
          !stream ||
          !remoteVideo.current
        ) {
          return;
        }

        remoteVideo.current.srcObject =
          stream;

        remoteVideo.current
          .play()
          .catch((err) => {
            console.warn(
              "Remote video autoplay blocked:",
              err
            );
          });
      };

      /*
       * Overall connection state.
       */
      connection.onconnectionstatechange =
        () => {
          console.log(
            "📡 WebRTC connection state:",
            connection.connectionState
          );

          if (
            connection.connectionState ===
            "connected"
          ) {
            clearTimer();

            if (mounted.current) {
              setError("");
              setState("connected");
            }
          }

          if (
            connection.connectionState ===
            "connecting"
          ) {
            if (mounted.current) {
              setState("connecting");
            }
          }

          if (
            connection.connectionState ===
            "disconnected"
          ) {
            if (mounted.current) {
              setState("connecting");
            }
          }

          if (
            connection.connectionState ===
            "failed"
          ) {
            clearTimer();

            if (mounted.current) {
              setError(
                "The call could not establish a connection. Check the network connection or TURN configuration."
              );

              /*
               * Do not immediately destroy everything.
               * Keeping the peer alive briefly allows ICE
               * recovery on some networks.
               */
            }
          }

          if (
            connection.connectionState ===
            "closed"
          ) {
            if (mounted.current) {
              resetCall(false);
            }
          }
        };

      peer.current = connection;

      return connection;
    },
    [
      conversationId,
      clearTimer,
      resetCall,
    ]
  );

  /*
   * ----------------------------------------------------------
   * ADD LOCAL TRACKS
   * ----------------------------------------------------------
   */

  const addLocalTracks = useCallback(
    (connection, stream) => {
      stream
        .getTracks()
        .forEach((track) => {
          const alreadyAdded =
            connection
              .getSenders()
              .some(
                (sender) =>
                  sender.track ===
                  track
              );

          if (!alreadyAdded) {
            connection.addTrack(
              track,
              stream
            );
          }
        });
    },
    []
  );

  /*
   * ----------------------------------------------------------
   * APPLY PENDING ICE
   * ----------------------------------------------------------
   */

  const applyPendingCandidates =
    useCallback(async (connection) => {
      if (
        !connection.remoteDescription
      ) {
        return;
      }

      const candidates =
        pendingCandidates.current;

      pendingCandidates.current = [];

      for (const candidate of candidates) {
        try {
          await connection.addIceCandidate(
            candidate
          );

          console.log(
            "🧊 Pending ICE candidate added"
          );
        } catch (err) {
          console.warn(
            "Unable to add pending ICE candidate:",
            err
          );
        }
      }
    }, []);

  /*
   * ----------------------------------------------------------
   * START CALL
   * ----------------------------------------------------------
   */

  const startCall = useCallback(async () => {
    setError("");

    if (!otherUserId) {
      setError(
        "The other user could not be identified."
      );
      return;
    }

    if (!conversationId) {
      setError(
        "The conversation could not be identified."
      );
      return;
    }

    if (!socket.connected) {
      setError(
        "Chat connection is offline. Please wait and try again."
      );
      return;
    }

    try {
      setState("calling");

      console.log(
        "📞 Starting call:",
        {
          conversationId,
          otherUserId,
        }
      );

      const stream =
        await getStream();

      const connection =
        createPeer(otherUserId);

      addLocalTracks(
        connection,
        stream
      );

      const offer =
        await connection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

      await connection.setLocalDescription(
        offer
      );

      console.log(
        "📤 Sending call offer"
      );

      socket.emit("callUser", {
        userToCall: Number(
          otherUserId
        ),

        offer:
          connection.localDescription,

        conversationId: Number(
          conversationId
        ),
      });

      clearTimer();

      callTimer.current =
        setTimeout(() => {
          if (
            stateRef.current ===
              "calling" ||
            stateRef.current ===
              "connecting"
          ) {
            console.warn(
              "⏰ Call timed out"
            );

            setError(
              "The call was not answered."
            );

            resetCall(
              true,
              otherUserId
            );
          }
        }, CALL_TIMEOUT);
    } catch (err) {
      console.error(
        "❌ Start call error:",
        err
      );

      resetCall(false);

      setError(
        mediaError(err)
      );
    }
  }, [
    otherUserId,
    conversationId,
    getStream,
    createPeer,
    addLocalTracks,
    clearTimer,
    resetCall,
  ]);

  /*
   * ----------------------------------------------------------
   * ACCEPT INCOMING CALL
   * ----------------------------------------------------------
   */

  const acceptCall = useCallback(
    async () => {
      if (
        !incoming?.from ||
        !incoming?.offer
      ) {
        setError(
          "This incoming call is no longer available."
        );

        resetCall(false);
        return;
      }

      if (!socket.connected) {
        setError(
          "Chat connection is offline."
        );
        return;
      }

      try {
        setError("");
        setState("connecting");

        console.log(
          "📲 Accepting call from:",
          incoming.from
        );

        const stream =
          await getStream();

        const connection =
          createPeer(
            incoming.from
          );

        addLocalTracks(
          connection,
          stream
        );

        await connection.setRemoteDescription(
          new RTCSessionDescription(
            incoming.offer
          )
        );

        console.log(
          "✅ Remote offer applied"
        );

        await applyPendingCandidates(
          connection
        );

        const answer =
          await connection.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });

        await connection.setLocalDescription(
          answer
        );

        console.log(
          "📤 Sending call answer"
        );

        socket.emit("answerCall", {
          callerId: Number(
            incoming.from
          ),

          answer:
            connection.localDescription,

          conversationId: Number(
            conversationId
          ),
        });

        setIncoming(null);
        setState("connecting");
      } catch (err) {
        console.error(
          "❌ Accept call error:",
          err
        );

        resetCall(false);

        setError(
          mediaError(err)
        );
      }
    },
    [
      incoming,
      conversationId,
      getStream,
      createPeer,
      addLocalTracks,
      applyPendingCandidates,
      resetCall,
    ]
  );

  /*
   * ----------------------------------------------------------
   * REJECT CALL
   * ----------------------------------------------------------
   */

  const rejectCall = useCallback(() => {
    if (
      incoming?.from &&
      socket.connected
    ) {
      socket.emit("endCall", {
        targetUserId: Number(
          incoming.from
        ),

        conversationId: Number(
          conversationId
        ),
      });
    }

    resetCall(false);
  }, [
    incoming,
    conversationId,
    resetCall,
  ]);

  /*
   * ----------------------------------------------------------
   * END CALL
   * ----------------------------------------------------------
   */

  const endCall = useCallback(() => {
    if (
      socket.connected &&
      otherUserId
    ) {
      socket.emit("endCall", {
        targetUserId: Number(
          otherUserId
        ),

        conversationId: Number(
          conversationId
        ),
      });
    }

    resetCall(false);
  }, [
    otherUserId,
    conversationId,
    resetCall,
  ]);

  /*
   * ----------------------------------------------------------
   * SOCKET SIGNALING
   * ----------------------------------------------------------
   */

  useEffect(() => {
    mounted.current = true;

    const handleIncoming = (
      data
    ) => {
      if (
        Number(
          data?.conversationId
        ) !== Number(conversationId)
      ) {
        return;
      }

      if (
        !data?.from ||
        !data?.offer
      ) {
        return;
      }

      console.log(
        "📲 INCOMING VIDEO CALL:",
        data
      );

      /*
       * If already in another call,
       * reject the new call.
       */
      if (
        stateRef.current !== "idle"
      ) {
        socket.emit("endCall", {
          targetUserId: Number(
            data.from
          ),

          conversationId: Number(
            conversationId
          ),
        });

        return;
      }

      setIncoming({
        from: Number(data.from),

        name:
          data.callerName ||
          "PropertyNestHomes User",

        offer: data.offer,
      });

      setState("incoming");
    };

    const handleAccepted =
      async (data) => {
        if (
          Number(
            data?.conversationId
          ) !== Number(conversationId)
        ) {
          return;
        }

        if (
          !peer.current ||
          !data.answer
        ) {
          return;
        }

        try {
          console.log(
            "📲 CALL ANSWER RECEIVED"
          );

          await peer.current.setRemoteDescription(
            new RTCSessionDescription(
              data.answer
            )
          );

          console.log(
            "✅ Remote answer applied"
          );

          await applyPendingCandidates(
            peer.current
          );

          setState("connecting");
        } catch (err) {
          console.error(
            "❌ Call answer error:",
            err
          );

          setError(
            "The call answer could not be completed."
          );
        }
      };

    const handleIce = async (
      data
    ) => {
      if (
        Number(
          data?.conversationId
        ) !== Number(conversationId)
      ) {
        return;
      }

      if (!data?.candidate) {
        return;
      }

      try {
        const candidate =
          new RTCIceCandidate(
            data.candidate
          );

        if (
          peer.current?.remoteDescription
        ) {
          await peer.current.addIceCandidate(
            candidate
          );

          console.log(
            "🧊 ICE candidate added"
          );
        } else {
          console.log(
            "🧊 Storing ICE candidate until remote description exists"
          );

          pendingCandidates.current.push(
            candidate
          );
        }
      } catch (err) {
        console.warn(
          "ICE candidate error:",
          err
        );
      }
    };

    const handleEnded = (
      data
    ) => {
      if (
        Number(
          data?.conversationId
        ) !== Number(conversationId)
      ) {
        return;
      }

      console.log(
        "📴 Remote call ended"
      );

      resetCall(false);
    };

    const handleError = (
      data
    ) => {
      if (
        data?.conversationId &&
        Number(
          data.conversationId
        ) !== Number(conversationId)
      ) {
        return;
      }

      console.error(
        "❌ Call signaling error:",
        data
      );

      clearTimer();
      resetCall(false);

      setError(
        data?.message ||
          "The call could not be connected."
      );
    };

    socket.on(
      "incomingCall",
      handleIncoming
    );

    socket.on(
      "callAccepted",
      handleAccepted
    );

    socket.on(
      "iceCandidate",
      handleIce
    );

    socket.on(
      "callEnded",
      handleEnded
    );

    socket.on(
      "callError",
      handleError
    );

    return () => {
      socket.off(
        "incomingCall",
        handleIncoming
      );

      socket.off(
        "callAccepted",
        handleAccepted
      );

      socket.off(
        "iceCandidate",
        handleIce
      );

      socket.off(
        "callEnded",
        handleEnded
      );

      socket.off(
        "callError",
        handleError
      );

      mounted.current = false;
    };
  }, [
    conversationId,
    clearTimer,
    resetCall,
    applyPendingCandidates,
  ]);

  /*
   * ----------------------------------------------------------
   * COMPONENT CLEANUP
   * ----------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      clearTimer();
      closePeer();
      stopStream();
    };
  }, [
    clearTimer,
    closePeer,
    stopStream,
  ]);

  /*
   * ----------------------------------------------------------
   * IDLE
   * ----------------------------------------------------------
   */

  if (state === "idle") {
    return (
      <div className="relative flex shrink-0 items-center">
        <button
          type="button"
          onClick={startCall}
          disabled={
            !otherUserId ||
            !conversationId
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Start video call"
          title="Video call"
        >
          🎥
        </button>

        {error && (
          <div
            role="alert"
            className="absolute right-0 top-12 z-[120] w-72 rounded-xl bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-xl"
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * INCOMING CALL
   * ----------------------------------------------------------
   */

  if (state === "incoming") {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl">
            📹
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Incoming video call
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {incoming?.name ||
              otherUserName}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={rejectCall}
              className="flex-1 rounded-xl bg-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
            >
              Decline
            </button>

            <button
              type="button"
              onClick={acceptCall}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * ACTIVE CALL
   * ----------------------------------------------------------
   */

  return (
    <div className="fixed inset-0 z-[99998] bg-black">
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      <video
        ref={localVideo}
        autoPlay
        muted
        playsInline
        className="absolute right-4 top-4 z-10 h-40 w-28 rounded-2xl border-2 border-white/50 bg-black object-cover shadow-xl sm:h-48 sm:w-36"
      />

      <div className="absolute left-4 top-4 z-20 rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
        {state === "calling" &&
          "Calling..."}

        {state === "connecting" &&
          "Connecting..."}

        {state === "connected" &&
          `Connected to ${
            otherUserName ||
            "PropertyNestHomes User"
          }`}
      </div>

      {error && (
        <div className="absolute left-1/2 top-20 z-30 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-medium text-white shadow-xl">
          {error}
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
        <button
          type="button"
          onClick={endCall}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-2xl transition hover:bg-red-700 active:scale-95"
          aria-label="End video call"
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
}
