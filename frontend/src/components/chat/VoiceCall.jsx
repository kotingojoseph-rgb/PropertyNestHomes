import { useCallback, useEffect, useRef, useState } from "react";
import socket, { connectSocket } from "../../socket";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const CALL_TIMEOUT = 30000;

const BASE_ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun.cloudflare.com:3478",
    ],
  },
];

async function getIceServers() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await fetch(
      `${API_URL}/api/calls/turn-credentials`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json().catch(() => null);

    if (
      response.ok &&
      Array.isArray(data?.iceServers) &&
      data.iceServers.length > 0
    ) {
      console.log(
        "✅ TURN credentials received:",
        data.iceServers.length
      );

      return [
        ...BASE_ICE_SERVERS,
        ...data.iceServers,
      ];
    }

    console.warn(
      "⚠️ TURN unavailable, using STUN:",
      data?.error || response.status
    );
  } catch (error) {
    console.warn(
      "⚠️ TURN request failed, using STUN:",
      error.message
    );
  }

  return BASE_ICE_SERVERS;
}

export default function VoiceCall({
  conversationId,
  otherUserId,
  otherUserName = "PropertyNestHomes User",
}) {
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const pendingIceRef = useRef([]);
  const timeoutRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);
  const stateRef = useRef("idle");
  const remoteAudioRef = useRef(null);

  const [state, setState] = useState("idle");
  const [incomingCall, setIncomingCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const changeState = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearCallTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);
  }, [stopTimer]);

  const stopStream = useCallback(() => {
    if (!streamRef.current) return;

    streamRef.current.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    streamRef.current = null;
  }, []);

  const closePeer = useCallback(() => {
    if (peerRef.current) {
      try {
        peerRef.current.onicecandidate = null;
        peerRef.current.ontrack = null;
        peerRef.current.onconnectionstatechange = null;
        peerRef.current.oniceconnectionstatechange = null;
        peerRef.current.close();
      } catch {}
    }

    peerRef.current = null;
    pendingIceRef.current = [];

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearCallTimeout();
    stopTimer();
    closePeer();
    stopStream();

    setIncomingCall(null);
    setMuted(false);
    setSeconds(0);
  }, [
    clearCallTimeout,
    stopTimer,
    closePeer,
    stopStream,
  ]);

  const endCall = useCallback(
    (notify = true, targetId = otherUserId) => {
      if (
        notify &&
        targetId &&
        socket.connected
      ) {
        socket.emit("endCall", {
          targetUserId: Number(targetId),
          conversationId: Number(conversationId),
        });
      }

      cleanup();
      changeState("idle");
    },
    [
      otherUserId,
      conversationId,
      cleanup,
      changeState,
    ]
  );

  const getMicrophone = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current;
    }

    if (!window.isSecureContext) {
      throw new Error(
        "Microphone access requires HTTPS."
      );
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "This browser does not support microphone calls."
      );
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

      streamRef.current = stream;

      console.log(
        "🎙️ Microphone acquired"
      );

      return stream;
    } catch (err) {
      console.error(
        "Microphone error:",
        err
      );

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        throw new Error(
          "Microphone permission was denied. Allow microphone access and try again."
        );
      }

      if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        throw new Error(
          "No microphone was found."
        );
      }

      throw new Error(
        err.message ||
          "Unable to access your microphone."
      );
    }
  }, []);

  const addLocalTracks = useCallback(
    (peer, stream) => {
      for (const track of stream.getTracks()) {
        const exists = peer
          .getSenders()
          .some(
            (sender) =>
              sender.track?.id === track.id
          );

        if (!exists) {
          peer.addTrack(track, stream);
        }
      }
    },
    []
  );

  const flushPendingIce = useCallback(
    async (peer) => {
      if (!peer.remoteDescription) {
        return;
      }

      const pending =
        pendingIceRef.current;

      pendingIceRef.current = [];

      for (const candidate of pending) {
        try {
          await peer.addIceCandidate(candidate);

          console.log(
            "🧊 Added queued ICE candidate"
          );
        } catch (err) {
          console.warn(
            "Could not add queued ICE:",
            err
          );
        }
      }
    },
    []
  );

  const createPeer = useCallback(
    (targetUserId, iceServers) => {
      if (peerRef.current) {
        return peerRef.current;
      }

      const peer =
        new RTCPeerConnection({
          iceServers,
          iceCandidatePoolSize: 10,
        });

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;

        if (!socket.connected) {
          console.warn(
            "⚠️ Cannot send ICE: socket disconnected"
          );
          return;
        }

        console.log(
          "🧊 Sending ICE candidate"
        );

        socket.emit("iceCandidate", {
          targetUserId: Number(targetUserId),
          candidate: event.candidate,
          conversationId: Number(conversationId),
        });
      };

      peer.oniceconnectionstatechange =
        () => {
          console.log(
            "🧊 ICE state:",
            peer.iceConnectionState
          );
        };

      peer.ontrack = (event) => {
        console.log(
          "🔊 Remote audio track received"
        );

        const stream =
          event.streams?.[0];

        if (!stream) return;

        if (!remoteAudioRef.current) {
          const audio =
            document.createElement("audio");

          audio.autoplay = true;
          audio.playsInline = true;

          document.body.appendChild(audio);

          remoteAudioRef.current = audio;
        }

        remoteAudioRef.current.srcObject =
          stream;

        remoteAudioRef.current
          .play()
          .then(() => {
            console.log(
              "🔊 Remote audio playing"
            );
          })
          .catch((err) => {
            console.warn(
              "⚠️ Audio autoplay blocked:",
              err.message
            );
          });
      };

      peer.onconnectionstatechange = () => {
        console.log(
          "📡 WebRTC state:",
          peer.connectionState
        );

        if (
          peer.connectionState === "connected"
        ) {
          clearCallTimeout();
          setError("");
          changeState("connected");
          startTimer();
        }

        if (
          peer.connectionState === "failed"
        ) {
          clearCallTimeout();

          setError(
            "Voice connection failed. Please check your internet connection."
          );

          changeState("error");
        }

        if (
          peer.connectionState === "closed"
        ) {
          cleanup();
          changeState("idle");
        }
      };

      peerRef.current = peer;

      console.log(
        "🧊 RTCPeerConnection created with",
        iceServers.length,
        "ICE server entries"
      );

      return peer;
    },
    [
      conversationId,
      clearCallTimeout,
      changeState,
      startTimer,
      cleanup,
    ]
  );

  const startCall = useCallback(
    async () => {
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

      try {
        if (!socket.connected) {
          console.log("🔌 Connecting to call server...");
          await connectSocket();
          console.log("✅ Call server connected");
        }

        if (!socket.connected) {
          throw new Error("Unable to connect to the call server.");
        }

        changeState("calling");

        console.log(
          "📞 Starting voice call",
          {
            conversationId,
            otherUserId,
          }
        );

        const stream =
          await getMicrophone();

        const iceServers =
          await getIceServers();

        const peer = createPeer(
          otherUserId,
          iceServers
        );

        addLocalTracks(peer, stream);

        const offer =
          await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          });

        await peer.setLocalDescription(
          offer
        );

        console.log(
          "📤 Sending call offer"
        );

        socket.emit("callUser", {
          userToCall: Number(otherUserId),
          offer,
          conversationId: Number(
            conversationId
          ),
        });

        clearCallTimeout();

        timeoutRef.current =
          setTimeout(() => {
            if (
              stateRef.current ===
                "calling" ||
              stateRef.current ===
                "connecting"
            ) {
              setError(
                "The call was not answered."
              );

              endCall(true);
            }
          }, CALL_TIMEOUT);
      } catch (err) {
        console.error(
          "❌ Start voice call failed:",
          err
        );

        cleanup();
        changeState("error");

        setError(
          err.message ||
            "Unable to start the voice call."
        );
      }
    },
    [
      otherUserId,
      conversationId,
      changeState,
      getMicrophone,
      createPeer,
      addLocalTracks,
      clearCallTimeout,
      cleanup,
      endCall,
    ]
  );

  const answerCall = useCallback(
    async () => {
      if (!incomingCall) return;

      try {
        setError("");

        changeState("connecting");

        const callerId =
          Number(incomingCall.from);

        console.log(
          "📞 Answering call from:",
          callerId
        );

        const stream =
          await getMicrophone();

        const iceServers =
          await getIceServers();

        const peer = createPeer(
          callerId,
          iceServers
        );

        addLocalTracks(peer, stream);

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            incomingCall.offer
          )
        );

        console.log(
          "📥 Remote offer applied"
        );

        await flushPendingIce(peer);

        const answer =
          await peer.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          });

        await peer.setLocalDescription(
          answer
        );

        console.log(
          "📤 Sending call answer"
        );

        socket.emit("answerCall", {
          callerId,
          answer,
          conversationId: Number(
            conversationId
          ),
        });

        setIncomingCall(null);
      } catch (err) {
        console.error(
          "❌ Answer voice call failed:",
          err
        );

        cleanup();
        changeState("error");

        setError(
          err.message ||
            "Unable to answer the voice call."
        );
      }
    },
    [
      incomingCall,
      conversationId,
      changeState,
      getMicrophone,
      createPeer,
      addLocalTracks,
      flushPendingIce,
      cleanup,
    ]
  );

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    socket.emit("endCall", {
      targetUserId: Number(
        incomingCall.from
      ),
      conversationId: Number(
        conversationId
      ),
    });

    cleanup();
    changeState("idle");
  }, [
    incomingCall,
    conversationId,
    cleanup,
    changeState,
  ]);

  const toggleMute = useCallback(() => {
    const track =
      streamRef.current?.getAudioTracks()?.[0];

    if (!track) return;

    track.enabled = !track.enabled;

    setMuted(!track.enabled);

    console.log(
      track.enabled
        ? "🎙️ Microphone unmuted"
        : "🔇 Microphone muted"
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const handleIncomingCall = (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      if (!data?.offer || !data?.from) {
        return;
      }

      console.log(
        "📲 Incoming voice call:",
        data
      );

      if (stateRef.current !== "idle") {
        socket.emit("endCall", {
          targetUserId: Number(data.from),
          conversationId: Number(
            conversationId
          ),
        });

        return;
      }

      setIncomingCall(data);
      setError("");
      changeState("incoming");
    };

    const handleCallAccepted =
      async (data) => {
        if (
          Number(data?.conversationId) !==
          Number(conversationId)
        ) {
          return;
        }

        if (
          !data?.answer ||
          !peerRef.current
        ) {
          return;
        }

        try {
          console.log(
            "📥 Call accepted; applying answer"
          );

          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(
              data.answer
            )
          );

          await flushPendingIce(
            peerRef.current
          );

          changeState("connecting");
        } catch (err) {
          console.error(
            "❌ Failed to apply answer:",
            err
          );

          setError(
            "Unable to establish the voice call."
          );

          cleanup();
          changeState("error");
        }
      };

    const handleIceCandidate =
      async (data) => {
        if (
          Number(data?.conversationId) !==
          Number(conversationId)
        ) {
          return;
        }

        if (!data?.candidate) return;

        const candidate =
          new RTCIceCandidate(
            data.candidate
          );

        if (
          peerRef.current?.remoteDescription
        ) {
          try {
            await peerRef.current.addIceCandidate(
              candidate
            );

            console.log(
              "🧊 Remote ICE candidate added"
            );
          } catch (err) {
            console.warn(
              "⚠️ Remote ICE candidate failed:",
              err
            );
          }
        } else {
          console.log(
            "🧊 Queueing ICE candidate"
          );

          pendingIceRef.current.push(
            candidate
          );
        }
      };

    const handleCallEnded = (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      console.log(
        "📴 Remote user ended call"
      );

      cleanup();
      changeState("idle");
      setError("");
    };

    const handleCallError = (data) => {
      if (
        data?.conversationId &&
        Number(data.conversationId) !==
          Number(conversationId)
      ) {
        return;
      }

      console.error(
        "❌ Call error:",
        data
      );

      cleanup();
      changeState("error");

      setError(
        data?.message ||
          "The voice call could not be completed."
      );
    };

    socket.on(
      "incomingCall",
      handleIncomingCall
    );

    socket.on(
      "callAccepted",
      handleCallAccepted
    );

    socket.on(
      "iceCandidate",
      handleIceCandidate
    );

    socket.on(
      "callEnded",
      handleCallEnded
    );

    socket.on(
      "callError",
      handleCallError
    );

    if (!socket.connected) {
      connectSocket();
    }

    return () => {
      mountedRef.current = false;

      socket.off(
        "incomingCall",
        handleIncomingCall
      );

      socket.off(
        "callAccepted",
        handleCallAccepted
      );

      socket.off(
        "iceCandidate",
        handleIceCandidate
      );

      socket.off(
        "callEnded",
        handleCallEnded
      );

      socket.off(
        "callError",
        handleCallError
      );

      cleanup();

      if (remoteAudioRef.current) {
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, [
    conversationId,
    changeState,
    cleanup,
    flushPendingIce,
  ]);

  const formatTime = (value) => {
    const minutes = Math.floor(value / 60);
    const secs = value % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={startCall}
        disabled={!otherUserId}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        title="Voice call"
        aria-label="Voice call"
      >
        📞
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#075e54] text-4xl text-white">
            📞
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            {state === "incoming"
              ? "Incoming voice call"
              : state === "calling"
              ? `Calling ${otherUserName}...`
              : state === "connected"
              ? otherUserName
              : "Voice call"}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {state === "incoming"
              ? "Someone is calling you"
              : state === "connected"
              ? formatTime(seconds)
              : state === "error"
              ? "Call failed"
              : "Connecting..."}
          </p>

          {state === "incoming" ? (
            <div className="mt-7 flex justify-center gap-8">
              <button
                type="button"
                onClick={rejectCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg"
                aria-label="Decline call"
              >
                ✕
              </button>

              <button
                type="button"
                onClick={answerCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl text-white shadow-lg"
                aria-label="Answer call"
              >
                📞
              </button>
            </div>
          ) : state === "error" ? (
            <div className="mt-7 flex justify-center gap-5">
              <button
                type="button"
                onClick={() => {
                  cleanup();
                  changeState("idle");
                  setError("");
                }}
                className="rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  cleanup();
                  changeState("idle");
                  setError("");

                  setTimeout(
                    () => startCall(),
                    0
                  );
                }}
                className="rounded-xl bg-[#075e54] px-5 py-3 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="mt-7 flex justify-center gap-5">
              {state === "connected" && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl"
                  aria-label={
                    muted
                      ? "Unmute microphone"
                      : "Mute microphone"
                  }
                >
                  {muted
                    ? "🔇"
                    : "🎙️"}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  endCall(true)
                }
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg"
                aria-label="End call"
              >
                📞
              </button>
            </div>
          )}

          {error && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
