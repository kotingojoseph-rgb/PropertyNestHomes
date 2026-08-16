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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const typingTimeout = useRef(null);

  const token = localStorage.getItem("token");

  /*
   * Decode the logged-in user once.
   */
  useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      return;
    }

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      setCurrentUserId(Number(payload.id));
    } catch (err) {
      console.error("Token decode error:", err);
      setCurrentUserId(null);
    }
  }, [token]);

  /*
   * Load conversation information.
   */
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
          data.error || "Unable to load conversation"
        );
      }

      setChatUser({
        id: Number(data.other_user_id),
        name:
          data.other_user_name ||
          "PropertyNestHomes User",
      });

      setError("");
    } catch (err) {
      console.error(
        "Load conversation error:",
        err
      );

      setError(
        err.message ||
          "Unable to load conversation."
      );
    }
  }, [conversationId, token]);

  /*
   * Load existing messages.
   */
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
          data.error || "Unable to load messages"
        );
      }

      setMessages(
        Array.isArray(data) ? data : []
      );

      setError("");
    } catch (err) {
      console.error(
        "Load messages error:",
        err
      );

      setError(
        err.message ||
          "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  /*
   * Load conversation and messages.
   */
  useEffect(() => {
    if (!conversationId || !token) {
      setLoading(false);
      return;
    }

    loadConversation();
    loadMessages();
  }, [
    conversationId,
    token,
    loadConversation,
    loadMessages,
  ]);

  /*
   * Socket connection + real-time events.
   */
  useEffect(() => {
    if (!conversationId || !token) {
      return;
    }

    const conversationNumber =
      Number(conversationId);

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
      console.log(
        "✅ Chat socket connected"
      );

      joinConversation();
    };

    const handleDisconnect = () => {
      console.warn(
        "⚠️ Chat socket disconnected"
      );

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
            Number(item.id) ===
            Number(message.id)
        );

        if (exists) {
          return previous;
        }

        return [...previous, message];
      });

      /*
       * If the message came from the other user,
       * acknowledge delivery and mark it read.
       */
      if (
        Number(message.sender_id) !==
        Number(currentUserId)
      ) {
        socket.emit(
          "messageDelivered",
          {
            messageId: message.id,
            conversationId:
              conversationNumber,
          }
        );

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

    const handleTyping = ({
      userId,
    }) => {
      if (
        Number(userId) ===
        Number(currentUserId)
      ) {
        return;
      }

      setTypingUser(true);

      clearTimeout(
        typingTimeout.current
      );

      typingTimeout.current =
        setTimeout(() => {
          setTypingUser(false);
        }, 2500);
    };

    const handleStoppedTyping = ({
      userId,
    }) => {
      if (
        Number(userId) ===
        Number(currentUserId)
      ) {
        return;
      }

      setTypingUser(false);
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "messageStatusUpdate",
      handleStatusUpdate
    );

    socket.on(
      "userTyping",
      handleTyping
    );

    socket.on(
      "userStoppedTyping",
      handleStoppedTyping
    );

    /*
     * Socket may already be connected.
     */
    if (socket.connected) {
      joinConversation();
    } else {
      connectSocket();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "messageStatusUpdate",
        handleStatusUpdate
      );

      socket.off(
        "userTyping",
        handleTyping
      );

      socket.off(
        "userStoppedTyping",
        handleStoppedTyping
      );

      clearTimeout(
        typingTimeout.current
      );
    };
  }, [
    conversationId,
    token,
    currentUserId,
  ]);

  /*
   * Send text message.
   */
  async function sendMessage(message) {
    const cleanMessage =
      String(message || "").trim();

    if (
      !cleanMessage ||
      !conversationId ||
      !token ||
      sending
    ) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation_id:
              Number(conversationId),
            message: cleanMessage,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Message could not be sent"
        );
      }

      /*
       * Normally the Socket.IO event will add
       * the message. This fallback makes the UI
       * reliable even if the sender's socket
       * misses the event.
       */
      setMessages((previous) => {
        if (
          previous.some(
            (item) =>
              Number(item.id) ===
              Number(data.id)
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
      console.error(
        "Send message error:",
        err
      );

      setError(
        err.message ||
          "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efeae2] p-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <h2 className="text-lg font-bold">
            Login required
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Please log in to use chat.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-5 rounded-xl bg-[#075e54] px-5 py-3 text-sm font-semibold text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
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
          {chatUser.name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {chatUser.name}
          </div>

          <div className="text-xs text-white/75">
            {typingUser
              ? "typing..."
              : socketOnline
              ? "online"
              : "connecting..."}
          </div>
        </div>

        <VideoCall
          conversationId={
            conversationId
          }
          otherUserId={
            chatUser.id
          }
          otherUserName={
            chatUser.name
          }
        />

        <button
          type="button"
          className="rounded-full p-2 text-xl hover:bg-white/10"
          title="More"
        >
          ⋮
        </button>
      </header>

      {error && (
        <div className="mx-auto w-full max-w-3xl px-3 pt-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading messages...
            </div>
          ) : (
            <MessageList
              messages={messages}
              currentUserId={
                currentUserId
              }
            />
          )}
        </div>

        <div className="sticky bottom-0 p-3">
          <MessageInput
            onSend={sendMessage}
            conversationId={
              conversationId
            }
            disabled={sending}
          />
        </div>
      </main>
    </div>
  );
}
