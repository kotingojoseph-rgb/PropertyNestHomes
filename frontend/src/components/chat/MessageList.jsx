export default function MessageList({
  messages,
  currentUserId,
}) {
  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
      {messages.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">
          No messages yet.
        </div>
      ) : (
        messages.map((msg) => {
          const mine =
            Number(msg.sender_id) === Number(currentUserId);

          return (
            <div
              key={msg.id}
              className={`flex ${
                mine ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm ${
                  mine
                    ? "rounded-br-md bg-[#d9fdd3] text-gray-900"
                    : "rounded-bl-md bg-white text-gray-900"
                }`}
              >
                {msg.audio_url ? (
                  <audio
                    controls
                    src={msg.audio_url}
                    className="max-w-full"
                  />
                ) : msg.video_url ? (
                  <video
                    controls
                    playsInline
                    src={msg.video_url}
                    className="max-h-80 w-full rounded-lg"
                  />
                ) : (
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {msg.message}
                  </div>
                )}

                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {mine && (
                    <span className="font-medium">
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
          );
        })
      )}
    </div>
  );
}
