import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

export default function MessageInput({
  onSend,
  conversationId,
  disabled = false,
}) {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);

  function handleTyping(event) {
    const value = event.target.value;

    setMessage(value);

    if (!conversationId || disabled) return;

    socket.emit("typing", Number(conversationId));

    clearTimeout(typingTimer.current);

    if (!value.trim()) {
      socket.emit("stopTyping", Number(conversationId));
      return;
    }

    typingTimer.current = setTimeout(() => {
      socket.emit("stopTyping", Number(conversationId));
    }, 1200);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (message.trim() && !disabled) {
        handleSubmit(event);
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || disabled || uploading) return;

    socket.emit("stopTyping", Number(conversationId));

    onSend(cleanMessage);

    setMessage("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  async function startRecording() {
    if (disabled || uploading) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice recording is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStream.current = stream;

      let mimeType = "";

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunks.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks.current, {
            type: recorder.mimeType || "audio/webm",
          });

          if (!blob.size) {
            return;
          }

          setUploading(true);

          await uploadVoice(blob);
        } catch (error) {
          console.error("Voice upload error:", error);
          alert(error.message || "Voice note upload failed.");
        } finally {
          setUploading(false);

          if (mediaStream.current) {
            mediaStream.current.getTracks().forEach((track) => track.stop());
            mediaStream.current = null;
          }

          mediaRecorder.current = null;
          chunks.current = [];
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
      alert(error.message || "Microphone permission is required.");
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    timerRef.current = null;

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

    if (!token) {
      throw new Error("Please log in again.");
    }

    const formData = new FormData();

    formData.append(
      "file",
      blob,
      `voice-${Date.now()}.webm`
    );

    formData.append(
      "conversation_id",
      String(conversationId)
    );

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || "Voice upload failed."
      );
    }
  }

  useEffect(() => {
    return () => {
      clearTimeout(typingTimer.current);
      clearInterval(timerRef.current);

      if (conversationId) {
        socket.emit("stopTyping", Number(conversationId));
      }

      if (mediaRecorder.current?.state !== "inactive") {
        mediaRecorder.current?.stop();
      }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [conversationId]);

  return (
    <div className="border-t border-black/5 bg-[#f0f2f5] p-2 sm:p-3">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl items-end gap-2"
      >
        <div className="flex min-w-0 flex-1 items-end rounded-2xl bg-white px-2 py-1.5 shadow-sm">
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              {recordSeconds}s
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || uploading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Record voice note"
              aria-label="Record voice note"
            >
              🎤
            </button>
          )}

          <textarea
            ref={inputRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            disabled={disabled || recording || uploading}
            rows={1}
            placeholder={
              uploading
                ? "Uploading voice note..."
                : recording
                ? "Recording voice note..."
                : "Type a message..."
            }
            className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={
            disabled ||
            uploading ||
            recording ||
            !message.trim()
          }
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-lg text-white shadow-sm transition hover:bg-[#064e47] disabled:cursor-not-allowed disabled:opacity-40"
          title="Send message"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
