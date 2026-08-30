import { useEffect, useRef, useState } from "react";
import socket from "../../socket";

export default function MessageInput({
  onSend,
  conversationId,
  disabled = false,
  replyingTo = null,
  onCancelReply,
}) {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [pendingVoice, setPendingVoice] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const previewUrlRef = useRef(null);
  const imagePreviewUrlRef = useRef(null);
  const typingTimerRef = useRef(null);

  function supportedMime() {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];

    for (const type of types) {
      try {
        if (MediaRecorder.isTypeSupported(type)) return type;
      } catch {}
    }

    return "";
  }

  function extension(type = "") {
    if (type.includes("ogg")) return "ogg";
    if (type.includes("mp4")) return "m4a";
    return "webm";
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function clearTimer() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function handleTyping(event) {
    const value = event.target.value;
    setMessage(value);
    setError("");

    if (!conversationId || disabled) return;

    socket.emit("typing", Number(conversationId));

    clearTimeout(typingTimerRef.current);

    if (!value.trim()) {
      socket.emit("stopTyping", Number(conversationId));
      return;
    }

    typingTimerRef.current = setTimeout(() => {
      socket.emit("stopTyping", Number(conversationId));
    }, 1200);
  }

  async function startRecording() {
    if (disabled || recording || uploading || pendingVoice) return;

    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone recording is not supported on this device."
        );
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error(
          "Voice recording is not supported by this browser."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeType = supportedMime();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        setError("Voice recording failed. Please try again.");
      };

      recorder.onstop = () => {
        const actualType =
          recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: actualType,
        });

        clearTimer();
        setRecording(false);
        stopStream();
        recorderRef.current = null;

        if (!blob.size) {
          setError("No voice recording was captured.");
          chunksRef.current = [];
          return;
        }

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = URL.createObjectURL(blob);

        setPendingVoice({
          blob,
          mimeType: actualType,
          duration: seconds,
        });

        chunksRef.current = [];
      };

      recorder.start(250);

      setSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
    } catch (err) {
      console.error("Start recording error:", err);

      clearTimer();
      stopStream();
      setRecording(false);

      setError(
        err.message ||
          "Microphone permission is required."
      );
    }
  }

  function stopRecording(event) {
    event?.preventDefault();
    event?.stopPropagation();

    clearTimer();

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setRecording(false);
      stopStream();
    }
  }

  async function sendVoice() {
    if (
      !pendingVoice ||
      uploading ||
      disabled ||
      !conversationId
    ) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();

      formData.append(
        "file",
        pendingVoice.blob,
        `voice-${Date.now()}.${extension(
          pendingVoice.mimeType
        )}`
      );

      formData.append(
        "conversation_id",
        String(conversationId)
      );

      formData.append("media_type", "audio");

      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error("API URL is not configured.");
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Voice upload failed (${response.status}).`
        );
      }

      if (!data.id || !data.audio_url) {
        console.error("Invalid voice response:", data);
        throw new Error(
          "Voice note was uploaded but no audio URL was returned."
        );
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setPendingVoice(null);
    } catch (err) {
      console.error("Voice send error:", err);
      setError(
        err.message || "Voice note could not be sent."
      );
    } finally {
      setUploading(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  function cancelVoice() {
    if (uploading) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPendingVoice(null);
    setError("");
  }


  async function openCamera() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      console.error("Camera error:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setError("Camera permission was denied. Allow camera access and try again.");
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setError("No camera was found on this device.");
      } else {
        setError(err.message || "Unable to open the camera.");
      }
    }
  }

  function closeCamera() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  function takePhoto() {
    const video = cameraVideoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera is not ready yet. Please wait a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture the photo.");
          return;
        }

        const file = new File(
          [blob],
          `camera-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        closeCamera();

        if (imagePreviewUrlRef.current) {
          URL.revokeObjectURL(imagePreviewUrlRef.current);
        }

        const previewUrl = URL.createObjectURL(file);
        imagePreviewUrlRef.current = previewUrl;

        setPendingImage({
          file,
          previewUrl,
        });

        setError("");
      },
      "image/jpeg",
      0.9
    );
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    imagePreviewUrlRef.current = previewUrl;

    setPendingImage({
      file,
      previewUrl,
    });
    setError("");
  }

  function cancelImage() {
    if (uploading) return;

    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }

    setPendingImage(null);
    setError("");
  }

  async function sendImage() {
    if (
      !pendingImage ||
      uploading ||
      disabled ||
      !conversationId
    ) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();

      formData.append(
        "file",
        pendingImage.file,
        pendingImage.file.name
      );

      formData.append(
        "conversation_id",
        String(conversationId)
      );

      formData.append("media_type", "image");

      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error("API URL is not configured.");
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Image upload failed (${response.status}).`
        );
      }

      if (!data.id && !data.image_url) {
        console.warn("Image upload response:", data);
      }

      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
        imagePreviewUrlRef.current = null;
      }

      setPendingImage(null);
    } catch (err) {
      console.error("Image send error:", err);
      setError(
        err.message || "Image could not be sent."
      );
    } finally {
      setUploading(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  async function sendText(event) {
    event.preventDefault();

    if (
      disabled ||
      recording ||
      uploading ||
      pendingVoice
    ) {
      return;
    }

    const clean = message.trim();

    if (!clean) return;

    socket.emit("stopTyping", Number(conversationId));

    onSend(
      clean,
      replyingTo?.id || null
    );
    setMessage("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      clearTimeout(typingTimerRef.current);

      if (conversationId) {
        socket.emit(
          "stopTyping",
          Number(conversationId)
        );
      }

      if (
        recorderRef.current &&
        recorderRef.current.state !== "inactive"
      ) {
        try {
          recorderRef.current.stop();
        } catch {}
      }

      stopStream();

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, [conversationId]);

  return (
    <div className="w-full min-w-0 shrink-0 overflow-hidden border-t border-black/5 bg-[#f0f2f5] px-1 pb-[max(3px,env(safe-area-inset-bottom))] pt-1 sm:p-3">
      {replyingTo && (
        <div className="mx-auto mb-1.5 flex w-full max-w-3xl items-center gap-2 rounded-xl border-l-4 border-[#128c7e] bg-white px-3 py-2 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-[#075e54]">
              Replying to message
            </div>

            <div className="mt-0.5 truncate text-xs text-gray-600">
              {replyingTo.message?.trim()
                ? replyingTo.message
                : replyingTo.audio_url
                ? "🎤 Voice message"
                : replyingTo.video_url
                ? "🎥 Video"
                : replyingTo.image_url
                ? "📷 Photo"
                : replyingTo.document_url
                ? "📄 Document"
                : "Message"}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg text-gray-500 transition hover:bg-gray-100"
            aria-label="Cancel reply"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mx-auto mb-1.5 flex w-full min-w-0 max-w-3xl items-center gap-2 overflow-hidden rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 sm:mb-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm">
          <span className="min-w-0 flex-1 break-words">
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
          <img
            src={pendingImage.previewUrl}
            alt="Selected image preview"
            className="h-16 w-16 rounded-lg object-cover"
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-gray-700">
              {pendingImage.file.name}
            </div>
            <div className="text-[11px] text-gray-400">
              Ready to send
            </div>
          </div>

          <button
            type="button"
            onClick={cancelImage}
            disabled={uploading}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Cancel image"
          >
            ×
          </button>

          <button
            type="button"
            onClick={sendImage}
            disabled={uploading || disabled}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#075e54] text-white shadow-sm disabled:opacity-50"
            aria-label="Send image"
          >
            {uploading ? "…" : "➤"}
          </button>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleImageSelect}
        className="hidden"
      />



      {cameraOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black p-4">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-black shadow-2xl">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black sm:aspect-video">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={closeCamera}
                className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-xl text-white"
                aria-label="Close camera"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-center gap-5 px-5 py-5">
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-full bg-white/15 px-5 py-3 font-semibold text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={takePhoto}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-lg"
                aria-label="Take photo"
              >
                📷
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={sendText}
        className="mx-auto flex w-full min-w-0 max-w-3xl items-end gap-1 sm:gap-2"
      >
        <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[18px] bg-white px-1 py-1 shadow-sm sm:rounded-[22px] sm:px-2">
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-red-600 active:bg-red-50 sm:h-10 sm:px-3 sm:text-sm"
              aria-label="Stop recording"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              {seconds}s
            </button>
          ) : pendingVoice ? (
            <>
              <audio
                controls
                preload="metadata"
                src={previewUrlRef.current || undefined}
                className="h-8 min-w-0 flex-1"
              />

              <button
                type="button"
                onClick={cancelVoice}
                disabled={uploading}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-gray-500 active:bg-gray-100 disabled:opacity-40"
                aria-label="Cancel voice note"
              >
                ×
              </button>
            </>
          ) : (
            <>
                <button
                    type="button"
                    onClick={openCamera}
                    disabled={disabled || uploading}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-gray-500 active:bg-gray-100 disabled:opacity-40 sm:h-10 sm:w-10 sm:text-lg"
                    aria-label="Take photo with camera"
                    title="Take photo with camera"
                  >
                    📷
                  </button>

<button
                type="button"
                onClick={startRecording}
                disabled={disabled || uploading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-gray-500 active:bg-gray-100 disabled:opacity-40 sm:h-10 sm:w-10 sm:text-lg"
                aria-label="Record voice note"
              >
                🎤
              </button>

              <textarea
                ref={inputRef}
                value={message}
                onChange={handleTyping}
                disabled={disabled || recording || uploading}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendText(event);
                  }
                }}
                rows={1}
                placeholder={
                  uploading
                    ? "Sending..."
                    : "Type a message..."
                }
                className="min-h-8 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-1.5 py-1.5 text-[13px] leading-5 outline-none placeholder:text-gray-400 sm:min-h-10 sm:px-2 sm:py-2.5 sm:text-sm"
              />
            </>
          )}
        </div>

        {pendingVoice ? (
          <button
            type="button"
            onClick={sendVoice}
            disabled={disabled || uploading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-white shadow-md transition active:scale-90 disabled:opacity-50 sm:h-11 sm:w-11"
            aria-label="Send voice message"
            title="Send voice message"
          >
            {uploading ? "…" : "➤"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={
              disabled ||
              uploading ||
              recording ||
              !message.trim()
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-white shadow-md transition active:scale-90 disabled:opacity-40 sm:h-11 sm:w-11"
            aria-label="Send message"
          >
            ➤
          </button>
        )}
      </form>
    </div>
  );
}
