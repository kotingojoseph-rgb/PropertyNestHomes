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

    const joinConversation = () => {
      socket.emit(
        "joinConversation",
        conversationId
      );

      socket.emit(
        "markMessagesRead",
        conversationId
      );
    };

    if (socket.connected) {
      joinConversation();
    } else {
      socket.once(
        "connect",
        joinConversation
      );
    }

    function handleNewMessage(message) {
      setMessages((previous) => {
        if (
          previous.some(
            (item) => item.id === message.id
          )
        ) {
          return previous;
        }

        return [
          ...previous,
          message,
        ];
      });

      if (
        Number(message.sender_id) !==
        Number(currentUserId)
      ) {
        socket.emit(
          "messageDelivered",
          {
            messageId: message.id,
            conversationId: Number(
              conversationId
            ),
          }
        );

        socket.emit(
          "markMessagesRead",
          conversationId
        );
      }
    }

    function handleMessageStatusUpdate({
      messageId,
      status,
    }) {
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          if (status === "read") {
            return {
              ...message,
              delivered_at:
                message.delivered_at ||
                new Date().toISOString(),
              read_at:
                message.read_at ||
                new Date().toISOString(),
            };
          }

          if (status === "delivered") {
            return {
              ...message,
              delivered_at:
                message.delivered_at ||
                new Date().toISOString(),
            };
          }

          return message;
        })
      );
    }

    function handleTyping() {
      setTypingUser(true);
    }

    function handleStoppedTyping() {
      setTypingUser(false);
    }

    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "messageStatusUpdate",
      handleMessageStatusUpdate
    );

    socket.on(
      "userTyping",
      handleTyping
    );

    socket.on(
      "userStoppedTyping",
      handleStoppedTyping
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "messageStatusUpdate",
        handleMessageStatusUpdate
      );

      socket.off(
        "userTyping",
        handleTyping
      );

      socket.off(
        "userStoppedTyping",
        handleStoppedTyping
      );

      socket.off(
        "connect",
        joinConversation
      );
    };
  }, [
    conversationId,
    token,
    currentUserId,
  ]);

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

      setMessages(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Load messages error:",
        error
      );
    }
  }

  async function sendMessage(message) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation_id:
              Number(conversationId),
            message,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to send message"
        );
      }
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );
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

      <div className="flex flex-1 flex-col overflow-hidden">

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
    </div>
  );
}
