export default function MessageList({
  messages,
  currentUserId,
}) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">

      {messages.length === 0 ? (
        <div className="text-center text-gray-500">
          No messages yet.
        </div>
      ) : (
        messages.map((msg) => {
          const mine =
            Number(msg.sender_id) ===
            Number(currentUserId);

          return (
            <div
              key={msg.id}
              className={`flex ${
                mine
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2 ${
                  mine
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-black"
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
                  <div className="text-sm">
                    {msg.message}
                  </div>
                )}

                <div className="mt-1 flex items-center justify-end gap-2 text-xs opacity-75">

                  <span>
                    {new Date(
                      msg.created_at
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {mine && (
                    <span>
                      {msg.read_at
                        ? "✓✓ Seen"
                        : msg.delivered_at
                        ? "✓✓ Delivered"
                        : "✓ Sent"}
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
