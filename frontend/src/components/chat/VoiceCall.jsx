import { useCallback, useEffect, useRef, useState } from "react";
import socket, { connectSocket } from "../../socket";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const CALL_TIMEOUT = 30000;

const BASE_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

async function getIceServers() {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("Authentication token is missing.");

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
      data.iceServers.length
    ) {
      return [...BASE_ICE_SERVERS, ...data.iceServers];
    }
  } catch (error) {
    console.warn("TURN unavailable:", error.message);
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
  const remoteAudioRef = useRef(null);
  const pendingIceRef = useRef([]);
  const timeoutRef = useRef(null);
  const timerRef = useRef(null);
  const stateRef = useRef("idle");
  const callIdRef = useRef(0);

  const [state, setState] = useState("idle");
  const [incomingCall, setIncomingCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const changeState = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimeoutCall = useCallback(() => {
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

  const stopMicrophone = useCallback(() => {
    if (!streamRef.current) return;

    streamRef.current.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    streamRef.current = null;
  }, []);

  const closePeer = useCallback(() => {
    const peer = peerRef.current;

    if (peer) {
      try {
        peer.onicecandidate = null;
        peer.ontrack = null;
        peer.onconnectionstatechange = null;
        peer.oniceconnectionstatechange = null;
        peer.close();
      } catch {}
    }

    peerRef.current = null;
    pendingIceRef.current = [];

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause?.();
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearTimeoutCall();
    stopTimer();
    closePeer();
    stopMicrophone();

    setIncomingCall(null);
    setMuted(false);
    setSeconds(0);
  }, [
    clearTimeoutCall,
    stopTimer,
    closePeer,
    stopMicrophone,
  ]);

  const endCall = useCallback(
    (notify = true, targetId = otherUserId) => {
      if (notify && targetId && socket.connected) {
        socket.emit("endCall", {
          targetUserId: Number(targetId),
          conversationId: Number(conversationId),
        });
      }

      cleanup();
      changeState("idle");
      setError("");
    },
    [
      otherUserId,
      conversationId,
      cleanup,
      changeState,
    ]
  );

  const getMicrophone = useCallback(async () => {
    if (streamRef.current) return streamRef.current;

    if (!window.isSecureContext) {
      throw new Error("Microphone access requires HTTPS.");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support microphone calls.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = stream;

      return stream;
    } catch (err) {
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
        throw new Error("No microphone was found.");
      }

      throw new Error(
        err.message || "Unable to access your microphone."
      );
    }
  }, []);

  const addLocalTracks = useCallback((peer, stream) => {
    stream.getTracks().forEach((track) => {
      const exists = peer
        .getSenders()
        .some((sender) => sender.track?.id === track.id);

      if (!exists) {
        peer.addTrack(track, stream);
      }
    });
  }, []);

  const flushIce = useCallback(async (peer) => {
    if (!peer.remoteDescription) return;

    const queued = [...pendingIceRef.current];
    pendingIceRef.current = [];

    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(candidate);
      } catch (error) {
        console.warn("ICE candidate error:", error);
      }
    }
  }, []);

  const createPeer = useCallback(
    (targetUserId, iceServers) => {
      if (peerRef.current) return peerRef.current;

      const peer = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
      });

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socket.connected) return;

        socket.emit("iceCandidate", {
          targetUserId: Number(targetUserId),
          candidate: event.candidate,
          conversationId: Number(conversationId),
        });
      };

      peer.ontrack = (event) => {
        const stream = event.streams?.[0];

        if (!stream) return;

        let audio = remoteAudioRef.current;

        if (!audio) {
          audio = document.createElement("audio");
          audio.autoplay = true;
          audio.playsInline = true;
          audio.setAttribute("playsinline", "");
          document.body.appendChild(audio);
          remoteAudioRef.current = audio;
        }

        audio.srcObject = stream;

        const playAudio = async () => {
          try {
            await audio.play();
          } catch (error) {
            console.warn("Remote audio play blocked:", error);
          }
        };

        playAudio();
      };

      peer.onconnectionstatechange = () => {
        const connectionState = peer.connectionState;

        console.log("📡 Voice connection:", connectionState);

        if (connectionState === "connected") {
          clearTimeoutCall();
          setError("");
          changeState("connected");
          startTimer();
        }

        if (connectionState === "failed") {
          clearTimeoutCall();
          setError(
            "Voice connection failed. Please check your internet connection."
          );
          changeState("error");
        }

        if (connectionState === "disconnected") {
          setTimeout(() => {
            if (
              peerRef.current === peer &&
              peer.connectionState === "disconnected"
            ) {
              endCall(false);
            }
          }, 5000);
        }

        if (connectionState === "closed") {
          if (peerRef.current === peer) {
            cleanup();
            changeState("idle");
          }
        }
      };

      peer.oniceconnectionstatechange = () => {
        console.log("🧊 ICE:", peer.iceConnectionState);

        if (peer.iceConnectionState === "failed") {
          peer.restartIce?.();
        }
      };

      peerRef.current = peer;

      return peer;
    },
    [
      conversationId,
      clearTimeoutCall,
      changeState,
      startTimer,
      cleanup,
      endCall,
    ]
  );

  const startCall = useCallback(async () => {
    if (stateRef.current !== "idle") return;

    setError("");

    if (!otherUserId) {
      setError("The other user could not be identified.");
      return;
    }

    if (!conversationId) {
      setError("The conversation could not be identified.");
      return;
    }

    const callId = ++callIdRef.current;

    try {
      if (!socket.connected) {
        await connectSocket();
      }

      if (!socket.connected) {
        throw new Error("Unable to connect to the call server.");
      }

      changeState("calling");

      const stream = await getMicrophone();

      if (callId !== callIdRef.current) return;

      const iceServers = await getIceServers();

      const peer = createPeer(otherUserId, iceServers);

      addLocalTracks(peer, stream);

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await peer.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: Number(otherUserId),
        offer: peer.localDescription,
        conversationId: Number(conversationId),
        callType: "voice",
      });

      clearTimeoutCall();

      timeoutRef.current = setTimeout(() => {
        if (
          stateRef.current === "calling" ||
          stateRef.current === "connecting"
        ) {
          endCall(true);
          setError("The call was not answered.");
          changeState("error");
        }
      }, CALL_TIMEOUT);
    } catch (err) {
      console.error("❌ Voice call failed:", err);

      cleanup();
      changeState("error");
      setError(
        err.message || "Unable to start the voice call."
      );
    }
  }, [
    otherUserId,
    conversationId,
    changeState,
    getMicrophone,
    createPeer,
    addLocalTracks,
    clearTimeoutCall,
    cleanup,
    endCall,
  ]);

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setError("");
      changeState("connecting");

      const callerId = Number(incomingCall.from);

      const stream = await getMicrophone();
      const iceServers = await getIceServers();

      const peer = createPeer(callerId, iceServers);

      addLocalTracks(peer, stream);

      await peer.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      await flushIce(peer);

      const answer = await peer.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        callerId,
        answer: peer.localDescription,
        conversationId: Number(conversationId),
        callType: "voice",
      });

      setIncomingCall(null);

      clearTimeoutCall();

      timeoutRef.current = setTimeout(() => {
        if (stateRef.current === "connecting") {
          endCall(true, callerId);
          setError("Unable to establish the voice connection.");
          changeState("error");
        }
      }, CALL_TIMEOUT);
    } catch (err) {
      console.error("❌ Answer call failed:", err);

      cleanup();
      changeState("error");
      setError(
        err.message || "Unable to answer the voice call."
      );
    }
  }, [
    incomingCall,
    conversationId,
    changeState,
    getMicrophone,
    createPeer,
    addLocalTracks,
    flushIce,
    clearTimeoutCall,
    cleanup,
    endCall,
  ]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    socket.emit("endCall", {
      targetUserId: Number(incomingCall.from),
      conversationId: Number(conversationId),
    });

    cleanup();
    changeState("idle");
    setError("");
  }, [
    incomingCall,
    conversationId,
    cleanup,
    changeState,
  ]);

  const toggleMute = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks();

    if (!tracks?.length) return;

    const nextMuted = tracks[0].enabled;

    tracks.forEach((track) => {
      track.enabled = !nextMuted;
    });

    setMuted(nextMuted);
  }, []);

  useEffect(() => {
    const handleIncomingCall = (data) => {
      if (
        Number(data?.conversationId) !== Number(conversationId) ||
        data?.callType !== "voice" ||
        !data?.offer ||
        !data?.from
      ) {
        return;
      }

      if (stateRef.current !== "idle") {
        socket.emit("endCall", {
          targetUserId: Number(data.from),
          conversationId: Number(conversationId),
          callType: "voice",
        });
        return;
      }

      setIncomingCall(data);
      setError("");
      changeState("incoming");
    };

    const handleCallAccepted = async (data) => {
      if (
        Number(data?.conversationId) !== Number(conversationId) ||
        !data?.answer ||
        !peerRef.current
      ) {
        return;
      }

      try {
        const peer = peerRef.current;

        await peer.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

        await flushIce(peer);

        changeState("connecting");
      } catch (err) {
        console.error("❌ Answer processing failed:", err);

        cleanup();
        changeState("error");
        setError("Unable to establish the voice call.");
      }
    };

    const handleIceCandidate = async (data) => {
      if (
        Number(data?.conversationId) !== Number(conversationId) ||
        !data?.candidate
      ) {
        return;
      }

      const candidate = new RTCIceCandidate(data.candidate);
      const peer = peerRef.current;

      if (!peer || !peer.remoteDescription) {
        pendingIceRef.current.push(candidate);
        return;
      }

      try {
        await peer.addIceCandidate(candidate);
      } catch (err) {
        console.warn("⚠️ ICE candidate failed:", err);
      }
    };

    const handleCallEnded = (data) => {
      if (
        Number(data?.conversationId) !== Number(conversationId)
      ) {
        return;
      }

      cleanup();
      changeState("idle");
      setError("");
    };

    const handleCallError = (data) => {
      if (
        data?.conversationId &&
        Number(data.conversationId) !== Number(conversationId)
      ) {
        return;
      }

      cleanup();
      changeState("error");
      setError(
        data?.message || "The voice call could not be completed."
      );
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", handleCallEnded);
    socket.on("callError", handleCallError);

    if (!socket.connected) {
      connectSocket().catch(() => {});
    }

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded", handleCallEnded);
      socket.off("callError", handleCallError);

      cleanup();
    };
  }, [
    conversationId,
    changeState,
    flushIce,
    cleanup,
  ]);

  const formatTime = (value) => {
    const minutes = Math.floor(value / 60);
    const secs = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
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

  const isIncoming = state === "incoming";
  const isConnected = state === "connected";
  const isError = state === "error";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#075e54] text-4xl text-white shadow-lg">
          📞
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          {isIncoming
            ? `${incomingCall?.callerName || "Someone"} is calling`
            : state === "calling"
            ? `Calling ${otherUserName}...`
            : isConnected
            ? otherUserName
            : isError
            ? "Voice call failed"
            : "Connecting..."}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {isIncoming
            ? "Incoming voice call"
            : isConnected
            ? formatTime(seconds)
            : isError
            ? "Something went wrong"
            : "Voice call"}
        </p>

        {isIncoming ? (
          <div className="mt-8 flex justify-center gap-10">
            <button
              type="button"
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg transition active:scale-95"
              aria-label="Decline call"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={answerCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl text-white shadow-lg transition active:scale-95"
              aria-label="Answer call"
            >
              📞
            </button>
          </div>
        ) : isError ? (
          <div className="mt-7 flex justify-center gap-4">
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

                setTimeout(() => {
                  startCall();
                }, 100);
              }}
              className="rounded-xl bg-[#075e54] px-5 py-3 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-6">
            {isConnected && (
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl transition active:scale-95"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? "🔇" : "🎙️"}
              </button>
            )}

            <button
              type="button"
              onClick={() => endCall(true)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg transition active:scale-95"
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
  );
}
