import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

export default function VideoCall({ conversationId }) {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peer = useRef(null);

  const [calling, setCalling] = useState(false);

  const createPeer = () => {
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
      remoteVideo.current.srcObject = event.streams[0];
    };

    peer.current = connection;

    return connection;
  };


  async function startCall() {

    setCalling(true);

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

    localVideo.current.srcObject = stream;


    const connection = createPeer();


    stream
      .getTracks()
      .forEach(track =>
        connection.addTrack(track, stream)
      );


    const offer =
      await connection.createOffer();

    await connection.setLocalDescription(
      offer
    );


    socket.emit("callUser", {
      offer,
      conversationId,
    });

  }


  useEffect(() => {

    socket.on(
      "incomingCall",
      async ({ offer }) => {

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video:true,
            audio:true,
          });

        localVideo.current.srcObject =
          stream;


        const connection =
          createPeer();


        stream
          .getTracks()
          .forEach(track =>
            connection.addTrack(track, stream)
          );


        await connection.setRemoteDescription(
          offer
        );


        const answer =
          await connection.createAnswer();


        await connection.setLocalDescription(
          answer
        );


        socket.emit(
          "answerCall",
          {
            conversationId,
            answer,
          }
        );

      }
    );


    socket.on(
      "callAccepted",
      async ({ answer }) => {

        await peer.current.setRemoteDescription(
          answer
        );

      }
    );


    socket.on(
      "iceCandidate",
      async ({ candidate }) => {

        if (peer.current) {
          await peer.current.addIceCandidate(
            candidate
          );
        }

      }
    );


    return () => {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("iceCandidate");
    };


  }, [conversationId]);


  return (
    <div className="p-4 border-b">

      <button
        onClick={startCall}
        className="rounded bg-green-600 px-4 py-2 text-white"
      >
        📹 Start Video Call
      </button>


      {calling && (
        <div className="mt-4 grid grid-cols-2 gap-2">

          <video
            ref={localVideo}
            autoPlay
            muted
            className="rounded border"
          />


          <video
            ref={remoteVideo}
            autoPlay
            className="rounded border"
          />

        </div>
      )}

    </div>
  );
}
