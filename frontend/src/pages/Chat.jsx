import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import socket, { connectSocket } from "../socket";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import VideoCall from "../components/chat/VideoCall";

export default function Chat() {
  const { conversationId } = useParams();

  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
const [typingUser, setTypingUser] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      setCurrentUserId(payload.id);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  useEffect(() => {
    if (!conversationId || !token) return;

    loadMessages();

connectSocket();

socket.emit(
  "joinConversation",
  conversationId
);

    socket.on("newMessage", (message) => {

  setMessages((previous) => [
    ...previous,
    message,
  ]);

  socket.emit(
    "messageDelivered",
    message.id
  );

});
    
socket.on(
  "userTyping",
  () => {
    setTypingUser(true);
  }
);

socket.on(
  "userStoppedTyping",
  () => {
    setTypingUser(false);
  }
);

 return () => {
  socket.off("newMessage");
  socket.off("userTyping");
  socket.off("userStoppedTyping");
};
     

  }, [conversationId, token]);

  async function loadMessages() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/messages/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setMessages(data);

    } catch (error) {
      console.error(error);
    }
  }

  async function sendMessage(message) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/messages`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            conversation_id: Number(conversationId),
            message,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to send message");
      }

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="mx-auto flex h-[85vh] max-w-4xl flex-col rounded-lg border bg-white shadow">

      <div className="border-b p-4 text-xl font-bold">
        Property Chat
      </div>

<VideoCall
  conversationId={conversationId}
/>

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
      />

{typingUser && (
  <div className="px-4 py-2 text-sm text-gray-500">
    Someone is typing...
  </div>
)}

      <MessageInput
  onSend={sendMessage}
  conversationId={conversationId}
/>

    </div>
  );
}
