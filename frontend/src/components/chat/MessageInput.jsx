import { useState, useRef } from "react";
import socket from "../../socket";

export default function MessageInput({ onSend, conversationId }) {
  const [message, setMessage] = useState("");
  const typingTimer = useRef(null);

  function handleTyping(e) {
    const value = e.target.value;

    setMessage(value);

    if (!conversationId) return;

    socket.emit(
      "typing",
      conversationId
    );

    clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      socket.emit(
        "stopTyping",
        conversationId
      );
    }, 1000);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim()) return;

    socket.emit(
      "stopTyping",
      conversationId
    );

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
        onChange={handleTyping}
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
