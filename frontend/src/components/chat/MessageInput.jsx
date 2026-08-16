import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

export default function MessageInput({
  onSend,
  conversationId,
}) {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const typingTimer = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);

  function handleTyping(event) {
    const value = event.target.value;
    setMessage(value);

    if (!conversationId) return;

    socket.emit("typing", conversationId);

    clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      socket.emit("stopTyping", conversationId);
    }, 1000);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim()) return;

    socket.emit("stopTyping", conversationId);
    onSend(message.trim());
    setMessage("");
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Voice recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStream.current = stream;

      const recorder = new MediaRecorder(stream);

      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks.current, {
            type: recorder.mimeType || "audio/webm",
          });

          await uploadVoice(blob);
        } catch (error) {
          console.error("Voice upload error:", error);
          alert("Voice note upload failed.");
        } finally {
          if (mediaStream.current) {
            mediaStream.current.getTracks().forEach((track) => track.stop());
            mediaStream.current = null;
          }
        }
      };

      recorder.start();

      setRecordSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (error) {
      console.error("Recording error:", error);
      alert("Microphone permission is required.");
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);

    if (
      mediaRecorder.current &&
      mediaRecorder.current.state !== "inactive"
    ) {
      mediaRecorder.current.stop();
    }

    setRecording(false);
    setRecordSeconds(0);
  }

  async function uploadVoice(blob) {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append(
      "file",
      blob,
      `voice-${Date.now()}.webm`
    );
    formData.append("conversation_id", String(conversationId));
    formData.append("media_type", "audio");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/chat/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Voice upload failed");
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-2xl bg-white p-2 shadow-sm"
    >
      {recording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-medium text-white"
        >
          ⏹ {recordSeconds}s
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-gray-600 hover:bg-gray-100"
          title="Voice note"
        >
          🎤
        </button>
      )}

      <input
        type="text"
        value={message}
        onChange={handleTyping}
        placeholder="Type a message"
        className="min-h-11 flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#25d366]"
      />

      <button
        type="submit"
        disabled={!message.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-lg text-white disabled:opacity-40"
        title="Send"
      >
        ➤
      </button>
    </form>
  );
}
