import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import socket, { connectSocket } from "../socket";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import VideoCall from "../components/chat/VideoCall";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState({
    id: null,
    name: "PropertyNestHomes User",
  });
  const [typingUser, setTypingUser] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);
    } catch (error) {
      console.error("Token decode error:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!conversationId || !token) return;

    loadConversation();
    loadMessages();

    connectSocket();

    const joinConversation = () => {
      socket.emit("joinConversation", conversationId);
      socket.emit("markMessagesRead", Number(conversationId));
    };

    if (socket.connected) {
      joinConversation();
    } else {
      socket.once("connect", joinConversation);
    }

    const handleNewMessage = (message) => {
      setMessages((previous) => {
        if (previous.some((item) => item.id === message.id)) {
          return previous;
        }

        return [...previous, message];
      });

      if (Number(message.sender_id) !== Number(currentUserId)) {
        socket.emit("messageDelivered", {
          messageId: message.id,
          conversationId: Number(conversationId),
        });

        socket.emit("markMessagesRead", Number(conversationId));
      }
    };

    const handleStatusUpdate = ({ messageId, status }) => {
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== messageId) return message;

          if (status === "read") {
            return {
              ...message,
              delivered_at:
                message.delivered_at || new Date().toISOString(),
              read_at:
                message.read_at || new Date().toISOString(),
            };
          }

          if (status === "delivered") {
            return {
              ...message,
              delivered_at:
                message.delivered_at || new Date().toISOString(),
            };
          }

          return message;
        })
      );
    };

    const handleTyping = () => setTypingUser(true);
    const handleStoppedTyping = () => setTypingUser(false);

    socket.on("newMessage", handleNewMessage);
    socket.on("messageStatusUpdate", handleStatusUpdate);
    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStoppedTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageStatusUpdate", handleStatusUpdate);
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStoppedTyping);
      socket.off("connect", joinConversation);
    };
  }, [conversationId, token, currentUserId]);

  async function loadConversation() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Conversation error:", data);
        return;
      }

      setChatUser({
        id: data.other_user_id,
        name: data.other_user_name || "PropertyNestHomes User",
      });
    } catch (error) {
      console.error("Load conversation error:", error);
    }
  }

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

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load messages error:", error);
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
        const data = await response.json().catch(() => ({}));
        console.error("Send message error:", data);
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#efeae2]">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white shadow">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="rounded-full p-2 text-xl hover:bg-white/10"
          aria-label="Back"
        >
          ←
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold">
          {chatUser.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{chatUser.name}</div>
          <div className="text-xs text-white/70">
            {typingUser ? "typing..." : "online"}
          </div>
        </div>

        <VideoCall
          conversationId={conversationId}
          otherUserId={chatUser.id}
          otherUserName={chatUser.name}
        />

        <button
          type="button"
          className="rounded-full p-2 text-xl hover:bg-white/10"
          title="More"
        >
          ⋮
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
          />
        </div>

        <div className="sticky bottom-0 p-3">
          <MessageInput
            onSend={sendMessage}
            conversationId={conversationId}
          />
        </div>
      </main>
    </div>
  );
}
