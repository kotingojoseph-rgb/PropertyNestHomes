import { useState } from "react";

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim()) return;

    onSend(message);
    setMessage("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t p-4"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
      >
        Send
      </button>
    </form>
  );
}
