import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

export default function VideoCall({ conversationId }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peer = useRef(null);
  const localStream = useRef(null);
  const pendingCandidates = useRef([]);

  const [calling, setCalling] = useState(false);

  function createPeer() {
    if (peer.current) {
      return peer.current;
    }

    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          conversationId,
          candidate: event.candidate,
        });
      }
    };

    connection.ontrack = (event) => {
      console.log("[VideoCall] Remote stream received");

      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    connection.onconnectionstatechange = () => {
      console.log(
        "[VideoCall] Connection state:",
        connection.connectionState
      );

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
    console.log("[VideoCall] Start button clicked");

    try {
      setCalling(true);

      const stream = await getLocalStream();
      const connection = createPeer();

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
        conversationId,
        offer,
      });

      console.log("[VideoCall] Offer sent");
    } catch (error) {
      console.error("[VideoCall] Start call error:", error);
      cleanupCall(false);
    }
  }

  async function handleIncomingCall({ offer }) {
    console.log("[VideoCall] Incoming call");

    try {
      setCalling(true);

      const stream = await getLocalStream();
      const connection = createPeer();

      stream.getTracks().forEach((track) => {
        const alreadyAdded = connection
          .getSenders()
          .some((sender) => sender.track === track);

        if (!alreadyAdded) {
          connection.addTrack(track, stream);
        }
      });

      await connection.setRemoteDescription(offer);

      for (const candidate of pendingCandidates.current) {
        await connection.addIceCandidate(candidate);
      }

      pendingCandidates.current = [];

      const answer = await connection.createAnswer();

      await connection.setLocalDescription(answer);

      socket.emit("answerCall", {
        conversationId,
        answer,
      });

      console.log("[VideoCall] Answer sent");
    } catch (error) {
      console.error("[VideoCall] Incoming call error:", error);
      cleanupCall(false);
    }
  }

  async function handleCallAccepted({ answer }) {
    try {
      if (!peer.current) {
        console.warn("[VideoCall] No peer connection for accepted call");
        return;
      }

      await peer.current.setRemoteDescription(answer);

      for (const candidate of pendingCandidates.current) {
        await peer.current.addIceCandidate(candidate);
      }

      pendingCandidates.current = [];

      console.log("[VideoCall] Call accepted");
    } catch (error) {
      console.error("[VideoCall] Call accepted error:", error);
    }
  }

  async function handleIceCandidate({ candidate }) {
    if (!candidate) {
      return;
    }

    try {
      if (peer.current?.remoteDescription) {
        await peer.current.addIceCandidate(candidate);
      } else {
        pendingCandidates.current.push(candidate);
      }
    } catch (error) {
      console.error("[VideoCall] ICE candidate error:", error);
    }
  }

  function cleanupCall(notifyPeer = true) {
    console.log("[VideoCall] Cleaning up call");

    if (notifyPeer && conversationId) {
      socket.emit("endCall", conversationId);
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
      peer.current.onicecandidate = null;
      peer.current.ontrack = null;
      peer.current.onconnectionstatechange = null;
      peer.current.close();
      peer.current = null;
    }

    pendingCandidates.current = [];
    setCalling(false);
  }

  useEffect(() => {
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", () => {
      console.log("[VideoCall] Remote user ended the call");
      cleanupCall(false);
    });

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded");

      cleanupCall(false);
    };
  }, [conversationId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {!calling ? (
          <button
            type="button"
            onClick={startCall}
            className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            📹 Start Video Call
          </button>
        ) : (
          <button
            type="button"
            onClick={() => cleanupCall(true)}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            📞 End Call
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="min-h-48 w-full rounded border bg-black object-cover"
        />

        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="min-h-48 w-full rounded border bg-black object-cover"
        />
      </div>
    </div>
  );
}
