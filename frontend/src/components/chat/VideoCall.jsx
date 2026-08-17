import { useCallback, useEffect, useRef, useState } from "react";
import socket from "../../socket";

const CALL_TIMEOUT = 30000;

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function mediaError(error) {
  if (!error) return "Unable to access camera or microphone.";

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

    default:
      return error.message || "Unable to access your camera or microphone.";
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
  const pendingCandidates = useRef([]);

  const callTimer = useRef(null);
  const mounted = useRef(true);
  const stateRef = useRef("idle");

  const [state, setState] = useState("idle");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [incoming, setIncoming] = useState(null);
  const [error, setError] = useState("");

  const clearTimer = useCallback(() => {
    if (callTimer.current) {
      clearTimeout(callTimer.current);
      callTimer.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (!localStream.current) return;

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

  const closePeer = useCallback(() => {
    if (!peer.current) return;

    try {
      peer.current.onicecandidate = null;
      peer.current.ontrack = null;
      peer.current.onconnectionstatechange = null;
      peer.current.oniceconnectionstatechange = null;
      peer.current.close();
    } catch {}

    peer.current = null;

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }
  }, []);

  const resetCall = useCallback(
    (notifyUser = false, targetId = null) => {
      clearTimer();

      const target = targetId || otherUserId;

      if (notifyUser && target && socket.connected) {
        socket.emit("endCall", {
          targetUserId: Number(target),
          conversationId: Number(conversationId),
        });
      }

      closePeer();
      stopStream();

      pendingCandidates.current = [];
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

  const getStream = useCallback(async () => {
    if (localStream.current) return localStream.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera and microphone are not supported by this browser."
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
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
      localVideo.current.play().catch(() => {});
    }

    return stream;
  }, []);

  const createPeer = useCallback(
    (targetUserId) => {
      if (peer.current) return peer.current;

      const connection = new RTCPeerConnection(RTC_CONFIG);

      connection.onicecandidate = (event) => {
        if (!event.candidate || !socket.connected) return;

        socket.emit("iceCandidate", {
          targetUserId: Number(targetUserId),
          candidate: event.candidate,
          conversationId: Number(conversationId),
        });
      };

      connection.ontrack = (event) => {
        const stream = event.streams?.[0];

        if (!stream || !remoteVideo.current) return;

        remoteVideo.current.srcObject = stream;
        remoteVideo.current.play().catch(() => {});
      };

      connection.onconnectionstatechange = () => {
        console.log(
          "📡 WebRTC connection:",
          connection.connectionState
        );

        if (connection.connectionState === "connected") {
          clearTimer();
          setError("");
          setState("connected");
        }

        if (
          connection.connectionState === "failed" ||
          connection.connectionState === "closed"
        ) {
          if (mounted.current) {
            setError(
              connection.connectionState === "failed"
                ? "The call could not establish a connection."
                : ""
            );

            resetCall(false);
          }
        }

        if (connection.connectionState === "disconnected") {
          setState("connecting");
        }
      };

      connection.oniceconnectionstatechange = () => {
        if (
          connection.iceConnectionState === "failed"
        ) {
          setError(
            "Network connection failed. Please try again."
          );
        }
      };

      peer.current = connection;

      return connection;
    },
    [conversationId, clearTimer, resetCall]
  );

  const startCall = useCallback(async () => {
    setError("");

    if (!otherUserId) {
      setError("The other user could not be identified.");
      return;
    }

    if (!conversationId) {
      setError("The conversation could not be identified.");
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

      const stream = await getStream();
      const connection = createPeer(otherUserId);

      stream.getTracks().forEach((track) => {
        const alreadyAdded = connection
          .getSenders()
          .some((sender) => sender.track === track);

        if (!alreadyAdded) {
          connection.addTrack(track, stream);
        }
      });

      const offer = await connection.createOffer();

      await connection.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: Number(otherUserId),
        offer: connection.localDescription,
        conversationId: Number(conversationId),
      });

      clearTimer();

      callTimer.current = setTimeout(() => {
        setError("The call was not answered.");
        resetCall(true, otherUserId);
      }, CALL_TIMEOUT);
    } catch (err) {
      console.error("Start call error:", err);

      resetCall(false);
      setError(mediaError(err));
    }
  }, [
    otherUserId,
    conversationId,
    getStream,
    createPeer,
    clearTimer,
    resetCall,
  ]);

  const acceptCall = useCallback(async () => {
    if (!incoming?.from || !incoming?.offer) {
      setError("This incoming call is no longer available.");
      resetCall(false);
      return;
    }

    if (!socket.connected) {
      setError("Chat connection is offline.");
      return;
    }

    try {
      setError("");
      setState("connecting");

      const stream = await getStream();
      const connection = createPeer(incoming.from);

      stream.getTracks().forEach((track) => {
        const alreadyAdded = connection
          .getSenders()
          .some((sender) => sender.track === track);

        if (!alreadyAdded) {
          connection.addTrack(track, stream);
        }
      });

      await connection.setRemoteDescription(
        new RTCSessionDescription(incoming.offer)
      );

      for (const candidate of pendingCandidates.current) {
        try {
          await connection.addIceCandidate(candidate);
        } catch (err) {
          console.warn(
            "Unable to add pending ICE candidate:",
            err
          );
        }
      }

      pendingCandidates.current = [];

      const answer = await connection.createAnswer();

      await connection.setLocalDescription(answer);

      socket.emit("answerCall", {
        callerId: Number(incoming.from),
        answer: connection.localDescription,
        conversationId: Number(conversationId),
      });

      setIncoming(null);

      // Do NOT say connected yet.
      // onconnectionstatechange will do that.
      setState("connecting");
    } catch (err) {
      console.error("Accept call error:", err);

      resetCall(false);
      setError(mediaError(err));
    }
  }, [
    incoming,
    conversationId,
    getStream,
    createPeer,
    resetCall,
  ]);

  const rejectCall = useCallback(() => {
    if (incoming?.from && socket.connected) {
      socket.emit("endCall", {
        targetUserId: Number(incoming.from),
        conversationId: Number(conversationId),
      });
    }

    resetCall(false);
  }, [incoming, conversationId, resetCall]);

  useEffect(() => {
    mounted.current = true;

    const handleIncoming = (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      if (!data?.from || !data?.offer) return;

      console.log("📲 INCOMING VIDEO CALL", data);

      if (stateRef.current !== "idle") {
        socket.emit("endCall", {
          targetUserId: Number(data.from),
          conversationId: Number(conversationId),
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

    const handleAccepted = async (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      if (!peer.current || !data.answer) return;

      try {
        await peer.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

        for (const candidate of pendingCandidates.current) {
          try {
            await peer.current.addIceCandidate(candidate);
          } catch {}
        }

        pendingCandidates.current = [];

        setState("connecting");
      } catch (err) {
        console.error("Call answer error:", err);
        setError(
          "The call answer could not be completed."
        );
      }
    };

    const handleIce = async (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      if (!data?.candidate) return;

      try {
        const candidate = new RTCIceCandidate(
          data.candidate
        );

        if (peer.current?.remoteDescription) {
          await peer.current.addIceCandidate(candidate);
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (err) {
        console.warn("ICE candidate error:", err);
      }
    };

    const handleEnded = (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      console.log("📴 Remote call ended.");

      resetCall(false);
    };

    const handleError = (data) => {
      if (
        Number(data?.conversationId) !==
        Number(conversationId)
      ) {
        return;
      }

      clearTimer();
      resetCall(false);
      setError(
        data?.message || "The call could not be connected."
      );
    };

    socket.on("incomingCall", handleIncoming);
    socket.on("callAccepted", handleAccepted);
    socket.on("iceCandidate", handleIce);
    socket.on("callEnded", handleEnded);
    socket.on("callError", handleError);

    return () => {
      socket.off("incomingCall", handleIncoming);
      socket.off("callAccepted", handleAccepted);
      socket.off("iceCandidate", handleIce);
      socket.off("callEnded", handleEnded);
      socket.off("callError", handleError);

      mounted.current = false;
    };
  }, [
    conversationId,
    clearTimer,
    resetCall,
  ]);

  useEffect(() => {
    return () => {
      clearTimer();
      closePeer();
      stopStream();
    };
  }, [conversationId, clearTimer, closePeer, stopStream]);

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={startCall}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition hover:bg-white/10 active:scale-95"
        aria-label="Start video call"
        title="Video call"
      >
        🎥
      </button>
    );
  }

  if (state === "incoming") {
    const name =
      incoming?.name || "PropertyNestHomes User";

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl">
          <div className="bg-[#075e54] px-6 py-8 text-center text-white">
            <div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>

            <p className="mt-5 text-sm text-white/70">
              Incoming video call
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {name}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-12 p-7">
            <button
              type="button"
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg active:scale-95"
              aria-label="Decline call"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={acceptCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg active:scale-95"
              aria-label="Accept call"
            >
              📹
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-center px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="rounded-full bg-black/60 px-5 py-2 text-center text-sm text-white backdrop-blur">
          {state === "calling"
            ? `Calling ${otherUserName}...`
            : state === "connecting"
            ? "Connecting..."
            : otherUserName}
        </div>
      </div>

      <div className="absolute right-4 top-[max(65px,env(safe-area-inset-top)+50px)] h-36 w-28 overflow-hidden rounded-2xl border-2 border-white/80 bg-gray-900 shadow-xl sm:h-44 sm:w-32">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>

      {error && (
        <div className="absolute left-1/2 top-24 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-red-600/90 px-4 py-3 text-center text-sm text-white">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => resetCall(true)}
        className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-2xl active:scale-95"
        aria-label="End call"
      >
        ☎
      </button>
    </div>
  );
}
