import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

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

  const audioContext = useRef(null);
  const ringtoneTimer = useRef(null);

  const [callState, setCallState] = useState("idle");
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingCallerId, setIncomingCallerId] = useState(null);
  const [incomingCallerName, setIncomingCallerName] = useState("");

  function stopRingtone() {
    if (ringtoneTimer.current) {
      clearInterval(ringtoneTimer.current);
      ringtoneTimer.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close().catch(() => {});
      audioContext.current = null;
    }

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }

  function startRingtone() {
    stopRingtone();

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const context = new AudioContext();
      audioContext.current = context;

      const beep = () => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        gain.gain.setValueAtTime(
          0.0001,
          context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.12,
          context.currentTime + 0.03
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.35
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.35);
      };

      beep();

      ringtoneTimer.current = setInterval(beep, 1200);

      if (navigator.vibrate) {
        navigator.vibrate([500, 400, 500]);
      }
    } catch (error) {
      console.warn("Ringtone unavailable:", error);
    }
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

      socket.emit("iceCandidate", {
        targetUserId: Number(targetUserId),
        candidate: event.candidate,
        conversationId,
      });
    };

    connection.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") {
        setCallState("connected");
      }

      if (
        connection.connectionState === "failed" ||
        connection.connectionState === "closed"
      ) {
        cleanupCall(false);
      }
    };

    peer.current = connection;

    return connection;
  }

  async function getLocalStream() {
    if (localStream.current) {
      return localStream.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream.current = stream;

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    return stream;
  }

  async function startCall() {
    try {
      if (!otherUserId) {
        alert("The other user could not be identified.");
        return;
      }

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

      socket.emit("callUser", {
        userToCall: Number(otherUserId),
        offer,
        conversationId,
      });
    } catch (error) {
      console.error("Start call error:", error);
      cleanupCall(false);
      alert("Camera and microphone permission is required.");
    }
  }

  async function acceptCall() {
    try {
      stopRingtone();

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

      await connection.setRemoteDescription(incomingOffer);

      for (const candidate of pendingCandidates.current) {
        await connection.addIceCandidate(candidate);
      }

      pendingCandidates.current = [];

      const answer = await connection.createAnswer();

      await connection.setLocalDescription(answer);

      socket.emit("answerCall", {
        callerId: Number(incomingCallerId),
        answer,
        conversationId,
      });

      setIncomingOffer(null);
      setIncomingCallerId(null);
      setCallState("connected");
    } catch (error) {
      console.error("Accept call error:", error);
      rejectCall();
    }
  }

  function rejectCall() {
    stopRingtone();

    if (incomingCallerId) {
      socket.emit("endCall", {
        targetUserId: Number(incomingCallerId),
        conversationId,
      });
    }

    setIncomingOffer(null);
    setIncomingCallerId(null);
    setCallState("idle");
  }

  function handleIncomingCall({
    from,
    callerName,
    offer,
  }) {
    if (callState !== "idle") {
      socket.emit("endCall", {
        targetUserId: Number(from),
        conversationId,
      });
      return;
    }

    setIncomingCallerId(from);
    setIncomingCallerName(
      callerName || "PropertyNestHomes User"
    );
    setIncomingOffer(offer);
    setCallState("incoming");

    startRingtone();
  }

  async function handleCallAccepted({ answer }) {
    try {
      if (!peer.current) return;

      await peer.current.setRemoteDescription(answer);

      for (const candidate of pendingCandidates.current) {
        await peer.current.addIceCandidate(candidate);
      }

      pendingCandidates.current = [];
      setCallState("connected");
    } catch (error) {
      console.error("Call accepted error:", error);
    }
  }

  async function handleIceCandidate({ candidate }) {
    if (!candidate) return;

    try {
      if (peer.current?.remoteDescription) {
        await peer.current.addIceCandidate(candidate);
      } else {
        pendingCandidates.current.push(candidate);
      }
    } catch (error) {
      console.error("ICE candidate error:", error);
    }
  }

  function handleCallEnded() {
    cleanupCall(false);
  }

  function cleanupCall(notifyPeer = true) {
    stopRingtone();

    if (notifyPeer && otherUserId) {
      socket.emit("endCall", {
        targetUserId: Number(otherUserId),
        conversationId,
      });
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStream.current = null;
    }

    if (localVideo.current) {
      localVideo.current.srcObject = null;
    }

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = null;
    }

    if (peer.current) {
      peer.current.close();
      peer.current = null;
    }

    pendingCandidates.current = [];

    setIncomingOffer(null);
    setIncomingCallerId(null);
    setCallState("idle");
  }

  useEffect(() => {
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded", handleCallEnded);

      cleanupCall(false);
    };
  }, [conversationId, otherUserId, callState]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#25d366] text-3xl font-bold text-white">
            {incomingCallerName.charAt(0).toUpperCase()}
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
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white"
              aria-label="Decline call"
            >
              📵
            </button>

            <button
              type="button"
              onClick={acceptCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-2xl text-white"
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

      <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/50 px-5 py-2 text-sm text-white">
        {callState === "calling"
          ? `Calling ${otherUserName}...`
          : otherUserName}
      </div>

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
