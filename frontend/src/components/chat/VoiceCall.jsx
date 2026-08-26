import { useCallback, useEffect, useRef, useState } from "react";
import socket, { connectSocket } from "../../socket";

const CALL_TIMEOUT = 30000;

const RTC_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun.cloudflare.com:3478",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function VoiceCall({
  conversationId,
  otherUserId,
  otherUserName = "PropertyNestHomes User",
}) {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callTimerRef = useRef(null);
  const mountedRef = useRef(false);

  const [callState, setCallState] = useState("idle");
  const [incomingCall, setIncomingCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  const stateRef = useRef("idle");

  useEffect(() => {
    stateRef.current = callState;
  }, [callState]);

  const stopTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setSeconds(0);

    callTimerRef.current = setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);
  }, [stopTimer]);

  const formatTime = (value) => {
    const minutes = Math.floor(value / 60);
    const secs = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  const stopMicrophone = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    localStreamRef.current = null;
  }, []);

  const closePeer = useCallback(() => {
    if (peerRef.current) {
      try {
        peerRef.current.onicecandidate = null;
        peerRef.current.ontrack = null;
        peerRef.current.onconnectionstatechange = null;
        peerRef.current.close();
      } catch {}
    }

    peerRef.current = null;
    pendingCandidatesRef.current = [];
  }, []);

  const resetCall = useCallback(
    (notify = false, targetId = otherUserId) => {
      stopTimer();

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

      closePeer();
      stopMicrophone();

      setIncomingCall(null);
      setMuted(false);
      setSeconds(0);
      setCallState("idle");
    },
    [
      conversationId,
      otherUserId,
      stopTimer,
      closePeer,
      stopMicrophone,
    ]
  );

  const getMicrophone = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    if (!window.isSecureContext) {
      throw new Error(
        "Voice calls require a secure HTTPS connection."
      );
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Your browser does not support microphone calls."
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

      localStreamRef.current = stream;

      return stream;
    } catch (err) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        throw new Error(
          "Microphone permission was denied. Please allow microphone access and try again."
        );
      }

      if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        throw new Error(
          "No microphone was found on this device."
        );
      }

      if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        throw new Error(
          "Your microphone is being used by another application."
        );
      }

      throw new Error(
        err.message || "Unable to access the microphone."
      );
    }
  }, []);

  const addLocalTracks = useCallback(
    (peer, stream) => {
      stream.getTracks().forEach((track) => {
        const exists = peer
          .getSenders()
          .some((sender) => sender.track === track);

        if (!exists) {
          peer.addTrack(track, stream);
        }
      });
    },
    []
  );

  const createPeer = useCallback(
    (targetUserId) => {
      if (peerRef.current) {
        return peerRef.current;
      }

      const peer = new RTCPeerConnection(
        RTC_CONFIG
      );

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;

        if (!socket.connected) {
          console.warn(
            "Socket disconnected while sending ICE candidate."
          );
          return;
        }

        socket.emit("iceCandidate", {
          targetUserId: Number(targetUserId),
          candidate: event.candidate,
          conversationId: Number(conversationId),
        });
      };

      peer.ontrack = (event) => {
        const stream = event.streams?.[0];

        if (!stream) return;

        let audio = document.getElementById(
          `voice-call-audio-${conversationId}`
        );

        if (!audio) {
          audio = document.createElement("audio");
          audio.id = `voice-call-audio-${conversationId}`;
          audio.autoplay = true;
          audio.playsInline = true;
          audio.style.display = "none";
          document.body.appendChild(audio);
        }

        audio.srcObject = stream;

        audio.play().catch((err) => {
          console.warn(
            "Remote audio autoplay blocked:",
            err
          );
        });
      };

      peer.onconnectionstatechange = () => {
        console.log(
          "📞 Voice connection:",
          peer.connectionState
        );

        if (
          peer.connectionState === "connected"
        ) {
          setError("");
          setCallState("connected");
          startTimer();
        }

        if (
          peer.connectionState === "failed"
        ) {
          setError(
            "The voice call could not connect. Please check your internet connection."
          );
        }

        if (
          peer.connectionState === "closed"
        ) {
          resetCall(false);
        }
      };

      peerRef.current = peer;

      return peer;
    },
    [
      conversationId,
      resetCall,
      startTimer,
    ]
  );

  const applyPendingCandidates = useCallback(
    async (peer) => {
      if (!peer.remoteDescription) return;

      const candidates =
        pendingCandidatesRef.current;

      pendingCandidatesRef.current = [];

      for (const candidate of candidates) {
        try {
          await peer.addIceCandidate(candidate);
        } catch (err) {
          console.warn(
            "Unable to add ICE candidate:",
            err
          );
        }
      }
    },
    []
  );

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
      connectSocket();

      setError(
        "Connecting to chat server. Please try again in a moment."
      );

      return;
    }

    try {
      setCallState("calling");

      const stream = await getMicrophone();

      const peer = createPeer(otherUserId);

      addLocalTracks(peer, stream);

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await peer.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: Number(otherUserId),
        offer,
        conversationId: Number(conversationId),
      });

      console.log(
        "📞 Voice call started:",
        otherUserId
      );

      setTimeout(() => {
        if (
          stateRef.current === "calling"
        ) {
          setError(
            "The call was not answered."
          );

          resetCall(true);
        }
      }, CALL_TIMEOUT);
    } catch (err) {
      console.error(
        "Voice call start error:",
        err
      );

      resetCall(false);

      setError(
        err.message ||
          "Unable to start voice call."
      );
    }
  }, [
    otherUserId,
    conversationId,
    getMicrophone,
    createPeer,
    addLocalTracks,
    resetCall,
  ]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    setError("");

    try {
      const callerId =
        Number(incomingCall.from);

      const stream = await getMicrophone();

      const peer = createPeer(callerId);

      addLocalTracks(peer, stream);

      await peer.setRemoteDescription(
        new RTCSessionDescription(
          incomingCall.offer
        )
      );

      await applyPendingCandidates(peer);

      const answer =
        await peer.createAnswer();

      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        callerId,
        answer,
        conversationId: Number(
          conversationId
        ),
      });

      setIncomingCall(null);
      setCallState("connecting");
    } catch (err) {
      console.error(
        "Accept voice call error:",
        err
      );

      resetCall(false);

      setError(
        err.message ||
          "Unable to answer the voice call."
      );
    }
  }, [
    incomingCall,
    conversationId,
    getMicrophone,
    createPeer,
    addLocalTracks,
    applyPendingCandidates,
    resetCall,
  ]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    socket.emit("endCall", {
      targetUserId: Number(incomingCall.from),
      conversationId: Number(conversationId),
    });

    setIncomingCall(null);
    setCallState("idle");
  }, [incomingCall, conversationId]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const track = stream.getAudioTracks()[0];

    if (!track) return;

    track.enabled = !track.enabled;

    setMuted(!track.enabled);
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

      if (stateRef.current !== "idle") {
        socket.emit("endCall", {
          targetUserId: Number(data.from),
          conversationId: Number(
            conversationId
          ),
        });

        return;
      }

      console.log(
        "📲 Incoming voice call:",
        data
      );

      setIncomingCall(data);
      setCallState("incoming");
      setError("");
    };

    const handleCallAccepted = async (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      if (!data?.answer || !peerRef.current) {
        return;
      }

      try {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(
            data.answer
          )
        );

        await applyPendingCandidates(
          peerRef.current
        );

        setCallState("connecting");
      } catch (err) {
        console.error(
          "Call accepted error:",
          err
        );

        setError(
          "Unable to establish the voice call."
        );
      }
    };

    const handleIceCandidate = async (data) => {
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
        } catch (err) {
          console.warn(
            "Unable to add ICE candidate:",
            err
          );
        }
      } else {
        pendingCandidatesRef.current.push(
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

      resetCall(false);
    };

    const handleCallError = (data) => {
      if (
        data?.conversationId &&
        Number(data.conversationId) !==
          Number(conversationId)
      ) {
        return;
      }

      setError(
        data?.message ||
          "The voice call could not be completed."
      );

      resetCall(false);
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

      stopTimer();
      closePeer();
      stopMicrophone();

      const audio =
        document.getElementById(
          `voice-call-audio-${conversationId}`
        );

      if (audio) {
        audio.remove();
      }
    };
  }, [
    conversationId,
    applyPendingCandidates,
    resetCall,
    closePeer,
    stopMicrophone,
    stopTimer,
  ]);

  if (callState === "idle" && !error) {
    return (
      <button
        type="button"
        onClick={startCall}
        disabled={!otherUserId}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Call ${otherUserName}`}
        title={`Voice call ${otherUserName}`}
      >
        📞
      </button>
    );
  }

  return (
    <>
      {callState !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#075e54] text-4xl text-white">
              📞
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              {callState === "incoming"
                ? "Incoming voice call"
                : callState === "calling"
                ? `Calling ${otherUserName}...`
                : otherUserName}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {callState === "incoming"
                ? "Someone is calling you"
                : callState === "connected"
                ? formatTime(seconds)
                : "Connecting voice call..."}
            </p>

            {callState === "incoming" ? (
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
                  onClick={acceptCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl text-white shadow-lg"
                  aria-label="Answer call"
                >
                  📞
                </button>
              </div>
            ) : (
              <div className="mt-7 flex justify-center gap-5">
                {callState === "connected" && (
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
                    {muted ? "🔇" : "🎙️"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => resetCall(true)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg"
                  aria-label="End call"
                >
                  📞
                </button>
              </div>
            )}

            {error && (
              <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {callState === "idle" && error && (
        <button
          type="button"
          onClick={() => {
            setError("");
            startCall();
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
          title={error}
          aria-label="Retry voice call"
        >
          📞
        </button>
      )}
    </>
  );
}
