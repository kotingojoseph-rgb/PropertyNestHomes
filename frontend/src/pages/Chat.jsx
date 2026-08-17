import { useCallback, useEffect, useRef, useState } from "react";
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
  const [socketOnline, setSocketOnline] = useState(false);

  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const typingTimeout = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      setCurrentUserId(Number(payload.id));
    } catch (err) {
      console.error("Token decode error:", err);
      setCurrentUserId(null);
    }
  }, [token]);

  const loadConversation = useCallback(async () => {
    if (!conversationId || !token) return;

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
        throw new Error(
          data.error || "Unable to load conversation."
        );
      }

      const otherUserId = Number(
        data.other_user_id
      );

      setChatUser({
        id: otherUserId,
        name:
          data.other_user_name ||
          "PropertyNestHomes User",
      });

      if (socket.connected && otherUserId) {
        socket.emit(
          "getUserPresence",
          otherUserId
        );
      }

      setError("");
    } catch (err) {
      console.error("Load conversation error:", err);

      setError(
        err.message || "Unable to load conversation."
      );
    }
  }, [conversationId, token]);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !token) return;

    setLoading(true);

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

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load messages."
        );
      }

      setMessages(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Load messages error:", err);

      setError(
        err.message || "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (!conversationId || !token) {
      setLoading(false);
      return;
    }

    setMessages([]);
    setError("");

    loadConversation();
    loadMessages();
  }, [
    conversationId,
    token,
    loadConversation,
    loadMessages,
  ]);

  useEffect(() => {
    if (!conversationId || !token || !currentUserId) {
      return;
    }

    const conversationNumber = Number(conversationId);

    if (!Number.isInteger(conversationNumber)) {
      return;
    }

    const joinConversation = () => {
      setSocketOnline(true);

      socket.emit(
        "joinConversation",
        conversationNumber
      );

      socket.emit(
        "markMessagesRead",
        conversationNumber
      );
    };

    const handleConnect = () => {
      console.log("✅ Chat socket connected");
      joinConversation();
    };

    const handleDisconnect = () => {
      console.warn("⚠️ Chat socket disconnected");
      setSocketOnline(false);
    };

    const handleConnectError = (err) => {
      console.error(
        "❌ Chat socket error:",
        err.message
      );

      setSocketOnline(false);
    };

    const handleNewMessage = (message) => {
      if (
        Number(message.conversation_id) !==
        conversationNumber
      ) {
        return;
      }

      setMessages((previous) => {
        const exists = previous.some(
          (item) =>
            Number(item.id) === Number(message.id)
        );

        if (exists) {
          return previous;
        }

        return [...previous, message];
      });

      if (
        Number(message.sender_id) !==
        Number(currentUserId)
      ) {
        socket.emit("messageDelivered", {
          messageId: message.id,
          conversationId: conversationNumber,
        });

        socket.emit(
          "markMessagesRead",
          conversationNumber
        );
      }
    };

    const handleStatusUpdate = ({
      messageId,
      status,
    }) => {
      setMessages((previous) =>
        previous.map((message) => {
          if (
            Number(message.id) !==
            Number(messageId)
          ) {
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
              is_read: true,
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
    };

    const handleTyping = ({ userId }) => {
      if (
        Number(userId) ===
        Number(currentUserId)
      ) {
        return;
      }

      setTypingUser(true);

      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {
        setTypingUser(false);
      }, 2500);
    };

    const handleStoppedTyping = ({ userId }) => {
      if (
        Number(userId) ===
        Number(currentUserId)
      ) {
        return;
      }

      setTypingUser(false);
    };

    const handlePresenceSnapshot = (items = []) => {
      const other = items.find(
        (item) =>
          Number(item.userId) ===
          Number(chatUser.id)
      );

      if (!other) return;

      setOtherUserOnline(Boolean(other.isOnline));
      setOtherUserLastSeen(other.lastSeen || null);
    };

    const handlePresenceUpdate = (presence) => {
      if (
        Number(presence?.userId) !==
        Number(chatUser.id)
      ) {
        return;
      }

      setOtherUserOnline(
        Boolean(presence.isOnline)
      );

      setOtherUserLastSeen(
        presence.lastSeen || null
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("newMessage", handleNewMessage);
    socket.on(
      "messageStatusUpdate",
      handleStatusUpdate
    );
    socket.on("userTyping", handleTyping);
    socket.on(
      "userStoppedTyping",
      handleStoppedTyping
    );

    if (socket.connected) {
      joinConversation();
    } else {
      connectSocket();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(
        "connect_error",
        handleConnectError
      );
      socket.off("newMessage", handleNewMessage);
      socket.off(
        "messageStatusUpdate",
        handleStatusUpdate
      );
      socket.off("userTyping", handleTyping);
      socket.off(
        "userStoppedTyping",
        handleStoppedTyping
      );

      socket.off(
        "presenceSnapshot",
        handlePresenceSnapshot
      );

      socket.off(
        "presenceUpdate",
        handlePresenceUpdate
      );

      clearTimeout(typingTimeout.current);
    };
  }, [
    conversationId,
    token,
    currentUserId,
    chatUser.id,
  ]);

  async function sendMessage(message) {
    const cleanMessage = String(message || "").trim();

    if (
      !cleanMessage ||
      !conversationId ||
      !token ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

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
            message: cleanMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Message could not be sent."
        );
      }

      setMessages((previous) => {
        if (
          previous.some(
            (item) =>
              Number(item.id) === Number(data.id)
          )
        ) {
          return previous;
        }

        return [...previous, data];
      });

      socket.emit(
        "stopTyping",
        Number(conversationId)
      );
    } catch (err) {
      console.error("Send message error:", err);

      setError(
        err.message ||
          "Message could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f9] p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#075e54] text-2xl text-white">
            💬
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Sign in to Chat
          </h2>

          <p className="mt-2 text-sm leading-5 text-gray-500">
            Please log in to your PropertyNestHomes
            account to continue your conversation.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 w-full rounded-xl bg-[#075e54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#064e47]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const initial =
    chatUser.name?.charAt(0)?.toUpperCase() || "P";

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[#efeae2]">
      <header className="z-30 flex shrink-0 items-center gap-3 bg-[#075e54] px-3 py-2.5 text-white shadow-md sm:px-4">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-white/10"
          aria-label="Back to chats"
        >
          ←
        </button>

        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold">
          {initial}

          {otherUserOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#075e54] bg-green-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold sm:text-base">
            {chatUser.name}
          </div>

          <div className="truncate text-[11px] text-white/75 sm:text-xs">
            {typingUser ? (
              <span className="text-white">
                typing...
              </span>
            ) : otherUserOnline ? (
              <span className="text-green-300">
                online
              </span>
            ) : otherUserLastSeen ? (
              `last seen ${new Date(
                otherUserLastSeen
              ).toLocaleString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            ) : (
              "offline"
            )}
          </div>
        </div>

        <VideoCall
          conversationId={conversationId}
          otherUserId={chatUser.id}
          otherUserName={chatUser.name}
        />

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition hover:bg-white/10"
          title="More options"
          aria-label="More options"
        >
          ⋮
        </button>
      </header>

      {error && (
        <div className="z-20 mx-auto w-full max-w-3xl px-3 pt-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          loading={loading}
          otherUserName={chatUser.name}
        />

        <MessageInput
          onSend={sendMessage}
          conversationId={conversationId}
          disabled={sending}
        />
      </main>
    </div>
  );
}
