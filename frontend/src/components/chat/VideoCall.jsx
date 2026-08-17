import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

const CALL_TIMEOUT_MS = 30000;

function getMediaErrorMessage(error) {
  if (!error) {
    return "Unable to start the call.";
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera or microphone permission was denied. Please allow access in your browser settings and try again.";

    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone was found on this device.";

    case "NotReadableError":
    case "TrackStartError":
      return "Your camera or microphone is already being used by another application.";

    case "OverconstrainedError":
      return "The available camera or microphone does not support the requested settings.";

    case "SecurityError":
      return "The browser blocked camera or microphone access for security reasons. Make sure you are using HTTPS.";

    default:
      return error.message || "Unable to access the camera or microphone.";
  }
}

export default function VideoCall({
  conversationId,
  otherUserId,
  otherUserName = "User",
}) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);
  const callTimer = useRef(null);

  const [callState, setCallState] = useState("idle");
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingCallerId, setIncomingCallerId] = useState(null);
  const [incomingCallerName, setIncomingCallerName] = useState("");
  const [error, setError] = useState("");

  function clearCallTimer() {
    if (callTimer.current) {
      clearTimeout(callTimer.current);
      callTimer.current = null;
    }
  }

  function startCallTimer() {
    clearCallTimer();

    callTimer.current = setTimeout(() => {
      setError("The call was not answered.");
      cleanupCall(true);
    }, CALL_TIMEOUT_MS);
  }

  function stopLocalStream() {
    if (!localStream.current) return;

    localStream.current.getTracks().forEach((track) => {
      track.stop();
    });

    localStream.current = null;
  }

  function cleanupCall(notifyPeer = false) {
    clearCallTimer();

    if (notifyPeer && otherUserId && socket.connected) {
      socket.emit("endCall", {
        targetUserId: Number(otherUserId),
        conversationId: Number(conversationId),
      });
    }

    stopLocalStream();

    if (localVideo.current) {
      localVideo.current.srcObject = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    if (peer.current) {
      try {
        peer.current.onicecandidate = null;
        peer.current.ontrack = null;
        peer.current.close();
      } catch {
        // Ignore cleanup errors.
      }

      peer.current = null;
    }

    pendingCandidates.current = [];
    setIncomingOffer(null);
    setIncomingCallerId(null);
    setIncomingCallerName("");
    setCallState("idle");
  }

  async function getLocalStream() {
    if (localStream.current) {
      return localStream.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera and microphone access is not supported by this browser."
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
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
    }

    return stream;
  }

  function createPeer(targetUserId) {
    if (peer.current) {
      return peer.current;
    }

    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });

    connection.onicecandidate = (event) => {
      if (!event.candidate) return;
      if (!socket.connected) return;

      socket.emit("iceCandidate", {
        targetUserId: Number(targetUserId),
        candidate: event.candidate,
        conversationId: Number(conversationId),
      });
    };

    connection.ontrack = (event) => {
      const stream = event.streams?.[0];

      if (stream && remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
        remoteVideo.current.play().catch(() => {});
      }
    };

    connection.onconnectionstatechange = () => {
      console.log(
        "WebRTC connection state:",
        connection.connectionState
      );

      if (connection.connectionState === "connected") {
        clearCallTimer();
        setError("");
        setCallState("connected");
      }

      if (connection.connectionState === "failed") {
        setError(
          "The call could not establish a network connection. Please try again."
        );
        cleanupCall(false);
      }

      if (connection.connectionState === "closed") {
        cleanupCall(false);
      }
    };

    connection.oniceconnectionstatechange = () => {
      console.log(
        "WebRTC ICE state:",
        connection.iceConnectionState
      );

      if (
        connection.iceConnectionState === "failed"
      ) {
        setError(
          "The devices could not establish a direct connection. A TURN server may be required for this network."
        );
      }
    };

    peer.current = connection;

    return connection;
  }

  async function startCall() {
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
        "Chat connection is offline. Please wait a moment and try again."
      );
      console.error(
        "Cannot start call: Socket.IO is not connected."
      );
      return;
    }

    try {
      setCallState("calling");

      const stream = await getLocalStream();
      const connection = createPeer(otherUserId);

      stream.getTracks().forEach((track) => {
        const exists = connection
          .getSenders()
          .some((sender) => sender.track === track);

        if (!exists) {
          connection.addTrack(track, stream);
        }
      });

      const offer = await connection.createOffer();

      await connection.setLocalDescription(offer);

      console.log("📞 Sending call offer", {
        conversationId: Number(conversationId),
        targetUserId: Number(otherUserId),
      });

      socket.emit("callUser", {
        userToCall: Number(otherUserId),
        offer,
        conversationId: Number(conversationId),
      });

      startCallTimer();
    } catch (callError) {
      console.error("Start call error:", callError);

      cleanupCall(false);

      const message =
        callError.name === "NotAllowedError" ||
        callError.name === "PermissionDeniedError" ||
        callError.name === "NotFoundError" ||
        callError.name === "NotReadableError"
          ? getMediaErrorMessage(callError)
          : callError.message ||
            "Unable to start the video call.";

      setError(message);
    }
  }

  async function acceptCall() {
    setError("");

    if (!incomingCallerId || !incomingOffer) {
      setError("The incoming call is no longer available.");
      cleanupCall(false);
      return;
    }

    if (!socket.connected) {
      setError(
        "Chat connection is offline. Please reconnect and try again."
      );
      return;
    }

    try {
      const stream = await getLocalStream();
      const connection = createPeer(incomingCallerId);

      stream.getTracks().forEach((track) => {
        const exists = connection
          .getSenders()
          .some((sender) => sender.track === track);

        if (!exists) {
          connection.addTrack(track, stream);
        }
      });

      await connection.setRemoteDescription(
        new RTCSessionDescription(incomingOffer)
      );

      for (const candidate of pendingCandidates.current) {
        try {
          await connection.addIceCandidate(candidate);
        } catch (candidateError) {
          console.warn(
            "Pending ICE candidate failed:",
            candidateError
          );
        }
      }

      pendingCandidates.current = [];

      const answer = await connection.createAnswer();

      await connection.setLocalDescription(answer);

      console.log("📞 Sending call answer", {
        callerId: Number(incomingCallerId),
        conversationId: Number(conversationId),
      });

      socket.emit("answerCall", {
        callerId: Number(incomingCallerId),
        answer,
        conversationId: Number(conversationId),
      });

      setIncomingOffer(null);
      setIncomingCallerId(null);
      setIncomingCallerName("");
      setCallState("connected");
    } catch (callError) {
      console.error("Accept call error:", callError);

      const message = getMediaErrorMessage(callError);

      cleanupCall(false);
      setError(message);
    }
  }

  function rejectCall() {
    if (incomingCallerId && socket.connected) {
      socket.emit("endCall", {
        targetUserId: Number(incomingCallerId),
        conversationId: Number(conversationId),
      });
    }

    cleanupCall(false);
  }

  function handleIncomingCall({
    from,
    callerName,
    offer,
    conversationId: incomingConversationId,
  }) {
    if (
      Number(incomingConversationId) !==
      Number(conversationId)
    ) {
      return;
    }

    console.log("📲 Incoming call received", {
      from,
      conversationId: incomingConversationId,
    });

    if (callState !== "idle") {
      socket.emit("endCall", {
        targetUserId: Number(from),
        conversationId: Number(conversationId),
      });
      return;
    }

    setIncomingCallerId(Number(from));
    setIncomingCallerName(
      callerName || "PropertyNestHomes User"
    );
    setIncomingOffer(offer);
    setCallState("incoming");
  }

  async function handleCallAccepted({
    answer,
    conversationId: acceptedConversationId,
  }) {
    if (
      Number(acceptedConversationId) !==
      Number(conversationId)
    ) {
      return;
    }

    try {
      if (!peer.current) {
        return;
      }

      console.log("📲 Call accepted");

      await peer.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      for (const candidate of pendingCandidates.current) {
        try {
          await peer.current.addIceCandidate(candidate);
        } catch (candidateError) {
          console.warn(
            "Pending ICE candidate failed:",
            candidateError
          );
        }
      }

      pendingCandidates.current = [];
      clearCallTimer();
      setCallState("connected");
    } catch (callError) {
      console.error(
        "Call accepted error:",
        callError
      );

      setError(
        callError.message ||
          "Unable to complete the call connection."
      );
    }
  }

  async function handleIceCandidate({
    candidate,
    conversationId: candidateConversationId,
  }) {
    if (!candidate) return;

    if (
      Number(candidateConversationId) !==
      Number(conversationId)
    ) {
      return;
    }

    try {
      const iceCandidate =
        new RTCIceCandidate(candidate);

      if (peer.current?.remoteDescription) {
        await peer.current.addIceCandidate(
          iceCandidate
        );
      } else {
        pendingCandidates.current.push(
          iceCandidate
        );
      }
    } catch (candidateError) {
      console.error(
        "ICE candidate error:",
        candidateError
      );
    }
  }

  function handleCallEnded({
    conversationId: endedConversationId,
  }) {
    if (
      Number(endedConversationId) !==
      Number(conversationId)
    ) {
      return;
    }

    console.log("📴 Call ended by remote user.");
    cleanupCall(false);
  }

  function handleCallError({
    message,
    conversationId: errorConversationId,
  }) {
    if (
      Number(errorConversationId) !==
      Number(conversationId)
    ) {
      return;
    }

    console.warn("⚠️ Call error:", message);

    clearCallTimer();

    if (peer.current) {
      try {
        peer.current.close();
      } catch {
        // Ignore cleanup errors.
      }

      peer.current = null;
    }

    stopLocalStream();

    if (localVideo.current) {
      localVideo.current.srcObject = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    pendingCandidates.current = [];
    setIncomingOffer(null);
    setIncomingCallerId(null);
    setIncomingCallerName("");
    setCallState("idle");
    setError(
      message || "The call could not be connected."
    );
  }

  useEffect(() => {
    const onIncomingCall = (data) =>
      handleIncomingCall(data);

    const onCallAccepted = (data) =>
      handleCallAccepted(data);

    const onIceCandidate = (data) =>
      handleIceCandidate(data);

    const onCallEnded = (data) =>
      handleCallEnded(data);

    const onCallError = (data) =>
      handleCallError(data);

    socket.on("incomingCall", onIncomingCall);
    socket.on("callAccepted", onCallAccepted);
    socket.on("iceCandidate", onIceCandidate);
    socket.on("callEnded", onCallEnded);
    socket.on("callError", onCallError);

    return () => {
      socket.off("incomingCall", onIncomingCall);
      socket.off("callAccepted", onCallAccepted);
      socket.off("iceCandidate", onIceCandidate);
      socket.off("callEnded", onCallEnded);
      socket.off("callError", onCallError);
    };
  }, [conversationId]);

  useEffect(() => {
    return () => {
      clearCallTimer();
      cleanupCall(false);
    };
  }, [conversationId, otherUserId]);

  if (error && callState === "idle") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setError("");
            startCall();
          }}
          className="rounded-full p-2 text-xl hover:bg-white/10"
          title="Retry video call"
          aria-label="Retry video call"
        >
          📹
        </button>

        <span
          className="max-w-[220px] truncate text-[10px] text-red-200"
          title={error}
        >
          {error}
        </span>
      </div>
    );
  }

  if (callState === "idle") {
    return (
      <button
        type="button"
        onClick={startCall}
        className="rounded-full p-2 text-xl hover:bg-white/10"
        title="Video call"
        aria-label="Video call"
      >
        📹
      </button>
    );
  }

  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#25d366] text-3xl font-bold text-white animate-pulse">
            {incomingCallerName
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2 className="text-xl font-bold">
            {incomingCallerName}
          </h2>

          <p className="mt-1 text-gray-500">
            Incoming video call
          </p>

          <div className="mt-7 flex justify-center gap-8">
            <button
              type="button"
              onClick={rejectCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg"
              aria-label="Decline call"
            >
              📵
            </button>

            <button
              type="button"
              onClick={acceptCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-2xl text-white shadow-lg"
              aria-label="Answer call"
            >
              📹
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      <div className="absolute right-4 top-4 h-36 w-28 overflow-hidden rounded-xl border-2 border-white bg-gray-900 shadow-xl">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm text-white">
        {callState === "calling"
          ? `Calling ${otherUserName}...`
          : callState === "connected"
          ? otherUserName
          : "Connecting..."}
      </div>

      {error && (
        <div className="absolute left-1/2 top-20 w-[90%] max-w-md -translate-x-1/2 rounded-xl bg-red-600/90 px-4 py-3 text-center text-sm text-white">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => cleanupCall(true)}
        className="absolute bottom-10 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-xl"
        aria-label="End call"
      >
        📞
      </button>
    </div>
  );
}
