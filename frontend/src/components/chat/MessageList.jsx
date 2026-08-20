import { useEffect, useRef } from "react";

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getMessagePreview(message) {
  if (!message) return "";

  if (message.message?.trim()) {
    return message.message.trim();
  }

  if (message.audio_url) return "🎤 Voice message";
  if (message.video_url) return "🎥 Video";
  if (message.image_url) return "📷 Photo";
  if (message.document_url) return "📄 Document";

  return "Message";
}

export default function MessageList({
  messages = [],
  currentUserId,
  loading = false,
  otherUserName = "User",
  onReply,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const firstRender = useRef(true);

  const swipeRefs = useRef(new Map());
  const swipeState = useRef(null);

  useEffect(() => {
    if (!bottomRef.current) return;

    bottomRef.current.scrollIntoView({
      behavior: firstRender.current ? "auto" : "smooth",
      block: "end",
    });

    firstRender.current = false;
  }, [messages.length]);

  function startSwipe(event, msg) {
    if (!msg?.id) return;

    const touch = event.touches?.[0];

    if (!touch) return;

    swipeState.current = {
      id: msg.id,
      startX: touch.clientX,
      currentX: touch.clientX,
    };
  }

  function moveSwipe(event, msg) {
    const state = swipeState.current;

    if (!state || Number(state.id) !== Number(msg.id)) {
      return;
    }

    const touch = event.touches?.[0];

    if (!touch) return;

    state.currentX = touch.clientX;

    const distance = Math.max(
      0,
      Math.min(75, state.currentX - state.startX)
    );

    const element = swipeRefs.current.get(msg.id);

    if (element) {
      element.style.transform = `translateX(${distance}px)`;
      element.style.transition = "none";
    }
  }

  function endSwipe(msg) {
    const state = swipeState.current;

    if (!state || Number(state.id) !== Number(msg.id)) {
      return;
    }

    const distance = state.currentX - state.startX;

    const element = swipeRefs.current.get(msg.id);

    if (element) {
      element.style.transform = "translateX(0)";
      element.style.transition = "transform 180ms ease";
    }

    swipeState.current = null;

    if (distance >= 55) {
      onReply?.(msg);
    }
  }

  function cancelSwipe() {
    const state = swipeState.current;

    if (state) {
      const element = swipeRefs.current.get(state.id);

      if (element) {
        element.style.transform = "translateX(0)";
        element.style.transition = "transform 180ms ease";
      }
    }

    swipeState.current = null;
  }

  function scrollToMessage(messageId) {
    const element = document.getElementById(
      `message-${messageId}`
    );

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.classList.add(
      "ring-2",
      "ring-[#128c7e]"
    );

    setTimeout(() => {
      element.classList.remove(
        "ring-2",
        "ring-[#128c7e]"
      );
    }, 1200);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#efeae2]">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#075e54]" />
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-y-auto bg-[#efeae2] px-3 py-4 sm:px-5"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="max-w-xs rounded-2xl bg-white/90 px-6 py-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#075e54] text-2xl text-white">
                💬
              </div>

              <h3 className="font-semibold text-gray-800">
                Start the conversation
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Send a message to {otherUserName} to get started.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const mine =
              Number(msg.sender_id) === Number(currentUserId);

            const key =
              msg.id ??
              `${msg.created_at}-${msg.sender_id}-${msg.message}`;

            const replyTarget =
  msg.reply_to ||
  (msg.reply_to_message_id
    ? messages.find(
        (item) =>
          Number(item.id) ===
          Number(msg.reply_to_message_id)
      )
    : null);

            const replyPreview =
              replyTarget
                ? getMessagePreview(replyTarget)
                : null;

            const replySender =
              replyTarget
                ? Number(replyTarget.sender_id) ===
                  Number(currentUserId)
                  ? "You"
                  : otherUserName
                : "";

            return (
              <div
                key={key}
                id={msg.id ? `message-${msg.id}` : undefined}
                className={`flex ${
                  mine
                    ? "justify-end"
                    : "justify-start"
                } rounded-xl transition-all duration-300`}
              >
                <div
                  ref={(element) => {
                    if (msg.id && element) {
                      swipeRefs.current.set(
                        msg.id,
                        element
                      );
                    }
                  }}
                  onTouchStart={(event) =>
                    startSwipe(event, msg)
                  }
                  onTouchMove={(event) =>
                    moveSwipe(event, msg)
                  }
                  onTouchEnd={() =>
                    endSwipe(msg)
                  }
                  onTouchCancel={cancelSwipe}
                  className={`relative flex max-w-[88%] items-end gap-2 sm:max-w-[75%] ${
                    mine ? "flex-row-reverse" : ""
                  }`}
                >
                  {!mine && (
                    <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-[10px] font-bold text-white">
                      {getInitials(otherUserName)}
                    </div>
                  )}

                  <div
                    className={`group relative min-w-0 rounded-2xl px-3 py-2 shadow-sm ${
                      mine
                        ? "rounded-br-md bg-[#d9fdd3] text-gray-900"
                        : "rounded-bl-md bg-white text-gray-900"
                    }`}
                  >
                    {/* Desktop reply action */}
                    <button
                      type="button"
                      onClick={() => onReply?.(msg)}
                      className={`absolute top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm text-gray-500 shadow-md ring-1 ring-black/5 transition hover:bg-gray-50 hover:text-[#075e54] sm:flex ${
                        mine
                          ? "-left-9"
                          : "-right-9"
                      }`}
                      title="Reply"
                      aria-label="Reply to message"
                    >
                      ↩
                    </button>

                    {/* Quoted message */}
                    {replyTarget && (
                      <button
                        type="button"
                        onClick={() =>
                          scrollToMessage(
                            replyTarget.id
                          )
                        }
                        className="mb-2 block w-full min-w-0 overflow-hidden rounded-lg border-l-4 border-[#128c7e] bg-black/5 px-2.5 py-1.5 text-left transition hover:bg-black/10"
                      >
                        <div className="truncate text-[11px] font-bold text-[#075e54]">
                          {replySender}
                        </div>

                        <div className="mt-0.5 truncate text-xs text-gray-600">
                          {replyPreview}
                        </div>
                      </button>
                    )}

                    {msg.audio_url ? (
                      <audio
                        controls
                        preload="metadata"
                        src={msg.audio_url}
                        className="max-w-full"
                      />
                    ) : msg.video_url ? (
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        src={msg.video_url}
                        className="max-h-80 max-w-full rounded-xl"
                      />
                    ) : msg.image_url ? (
                      <img
                        src={msg.image_url}
                        alt="Message attachment"
                        className="max-h-80 max-w-full rounded-xl object-contain"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-[14px] leading-5">
                        {msg.message}
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500">
                      <span>
                        {formatTime(msg.created_at)}
                      </span>

                      {mine && (
                        <span
                          className={
                            msg.read_at
                              ? "font-bold text-[#128c7e]"
                              : "font-medium"
                          }
                          title={
                            msg.read_at
                              ? "Read"
                              : msg.delivered_at
                              ? "Delivered"
                              : "Sent"
                          }
                        >
                          {msg.read_at
                            ? "✓✓"
                            : msg.delivered_at
                            ? "✓✓"
                            : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
