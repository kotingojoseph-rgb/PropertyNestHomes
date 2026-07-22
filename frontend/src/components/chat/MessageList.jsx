export default function MessageList({ messages, currentUserId }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500">
          No messages yet.
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === currentUserId
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-xl px-4 py-2 ${
                msg.sender_id === currentUserId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <div className="text-sm">{msg.message}</div>

              <div className="mt-1 text-xs opacity-70">
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
