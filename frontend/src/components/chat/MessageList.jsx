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

export default function MessageList({
  messages = [],
  currentUserId,
  loading = false,
  otherUserName = "User",
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!bottomRef.current) return;

    bottomRef.current.scrollIntoView({
      behavior: firstRender.current ? "auto" : "smooth",
      block: "end",
    });

    firstRender.current = false;
  }, [messages.length]);

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

            return (
              <div
                key={key}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[88%] items-end gap-2 sm:max-w-[75%] ${
                    mine ? "flex-row-reverse" : ""
                  }`}
                >
                  {!mine && (
                    <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-[10px] font-bold text-white">
                      {getInitials(otherUserName)}
                    </div>
                  )}

                  <div
                    className={`min-w-0 rounded-2xl px-3 py-2 shadow-sm ${
                      mine
                        ? "rounded-br-md bg-[#d9fdd3] text-gray-900"
                        : "rounded-bl-md bg-white text-gray-900"
                    }`}
                  >
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
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-[14px] leading-5">
                        {msg.message}
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500">
                      <span>{formatTime(msg.created_at)}</span>

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
