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
  const [uploadError, setUploadError] = useState("");

  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);

  function handleTyping(event) {
    const value = event.target.value;

    setMessage(value);
    setUploadError("");

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

    if (!cleanMessage || disabled || uploading || recording) {
      return;
    }

    socket.emit("stopTyping", Number(conversationId));

    onSend(cleanMessage);

    setMessage("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function getSupportedMimeType() {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    for (const type of types) {
      try {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      } catch {
        // Continue checking the next type.
      }
    }

    return "";
  }

  function getFileExtension(mimeType) {
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("ogg")) return "ogg";
    return "webm";
  }

  async function startRecording() {
    if (disabled || uploading || recording) return;

    setUploadError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Voice recording is not supported by this browser."
        );
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error(
          "This browser does not support voice recording."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStream.current = stream;

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event.error
        );

        setUploadError(
          "Voice recording failed. Please try again."
        );
      };

      recorder.onstop = async () => {
        try {
          const actualMimeType =
            recorder.mimeType ||
            mimeType ||
            "audio/webm";

          const blob = new Blob(chunks.current, {
            type: actualMimeType,
          });

          if (!blob.size) {
            throw new Error(
              "No voice recording was captured."
            );
          }

          setUploading(true);
          setUploadError("");

          await uploadVoice(
            blob,
            actualMimeType
          );
        } catch (error) {
          console.error(
            "Voice upload error:",
            error
          );

          setUploadError(
            error.message ||
              "Voice note upload failed."
          );
        } finally {
          setUploading(false);

          if (mediaStream.current) {
            mediaStream.current
              .getTracks()
              .forEach((track) => track.stop());

            mediaStream.current = null;
          }

          mediaRecorder.current = null;
          chunks.current = [];

          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }
      };

      recorder.start(250);

      setRecordSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds(
          (seconds) => seconds + 1
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Recording error:",
        error
      );

      if (mediaStream.current) {
        mediaStream.current
          .getTracks()
          .forEach((track) => track.stop());

        mediaStream.current = null;
      }

      setRecording(false);

      setUploadError(
        error.message ||
          "Microphone permission is required."
      );
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

  async function uploadVoice(blob, mimeType) {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    if (!conversationId) {
      throw new Error(
        "Conversation could not be identified."
      );
    }

    const extension =
      getFileExtension(mimeType);

    const formData = new FormData();

    formData.append(
      "file",
      blob,
      `voice-${Date.now()}.${extension}`
    );

    formData.append(
      "conversation_id",
      String(conversationId)
    );

    formData.append(
      "media_type",
      "audio"
    );

    const apiUrl =
      import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      throw new Error(
        "API URL is not configured."
      );
    }

    const response = await fetch(
      `${apiUrl}/api/chat/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data =
      await response.json().catch(
        () => ({})
      );

    if (!response.ok) {
      throw new Error(
        data.error ||
          `Voice upload failed (${response.status}).`
      );
    }

    if (!data.id) {
      throw new Error(
        "Voice note was uploaded but the server returned an invalid message."
      );
    }

    /*
     * The backend emits newMessage through Socket.IO.
     * Return the message as well so callers can use it if needed.
     */
    return data;
  }

  useEffect(() => {
    return () => {
      clearTimeout(
        typingTimer.current
      );

      clearInterval(
        timerRef.current
      );

      if (conversationId) {
        socket.emit(
          "stopTyping",
          Number(conversationId)
        );
      }

      if (
        mediaRecorder.current &&
        mediaRecorder.current.state !==
          "inactive"
      ) {
        try {
          mediaRecorder.current.stop();
        } catch {
          // Recorder may already be stopping.
        }
      }

      if (mediaStream.current) {
        mediaStream.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, [conversationId]);

  return (
    <div className="shrink-0 border-t border-black/5 bg-[#f0f2f5] px-1.5 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 sm:p-3">
      {uploadError && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="min-w-0">
            {uploadError}
          </span>

          <button
            type="button"
            onClick={() =>
              setUploadError("")
            }
            className="shrink-0 font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl items-end gap-1.5 sm:gap-2"
      >
        <div className="flex min-w-0 flex-1 items-end rounded-[22px] bg-white px-1.5 py-1 shadow-sm sm:px-2 sm:py-1.5">
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              title="Stop recording"
              aria-label="Stop recording"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              {recordSeconds}s
            </button>
          ) : uploading ? (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center text-lg"
              title="Uploading voice note"
              aria-label="Uploading voice note"
            >
              ⏳
            </div>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={
                disabled ||
                uploading
              }
              className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-base text-gray-500 transition hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-10 sm:text-lg"
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
            disabled={
              disabled ||
              recording ||
              uploading
            }
            rows={1}
            placeholder={
              uploading
                ? "Uploading voice note..."
                : recording
                ? "Recording voice note..."
                : "Type a message..."
            }
            className="max-h-28 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1.5 py-2.5 text-[15px] leading-5 outline-none placeholder:text-gray-400 disabled:opacity-60 sm:px-2 sm:text-sm"
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-base text-white shadow-sm transition hover:bg-[#064e47] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 sm:text-lg"
          title="Send message"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
