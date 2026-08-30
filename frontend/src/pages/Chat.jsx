import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import socket, { connectSocket } from "../socket";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import VideoCall from "../components/chat/VideoCall";
import VoiceCall from "../components/chat/VoiceCall";

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
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const typingTimeout = useRef(null);

  const token = localStorage.getItem("token");

  async function reactToMessage(message, reaction) {
    if (!message?.id || !conversationId || !token) {
      return;
    }

    const reactions = Array.isArray(message.reactions)
      ? message.reactions
      : [];

    const myReaction = reactions.find(
      (item) =>
        Number(item.user_id) === Number(currentUserId)
    );

    const removing =
      myReaction?.reaction === reaction;

    try {
      const url =
        `${import.meta.env.VITE_API_URL}/api/chat/messages/${message.id}/reaction`;

      const response = await fetch(url, {
        method: removing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(removing
          ? {}
          : {
              body: JSON.stringify({
                reaction,
              }),
            }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (removing
              ? "Could not remove reaction."
              : "Could not react to message.")
        );
      }

      setMessages((previous) =>
        previous.map((item) =>
          Number(item.id) === Number(message.id)
            ? {
                ...item,
                reactions: data.reactions || [],
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Message reaction error:",
        err
      );

      setError(
        err.message ||
          "Could not update message reaction."
      );
    }
  }

  useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      return;
    }

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      setCurrentUserId(
        Number(payload.id)
      );
    } catch (err) {
      console.error(
        "Token decode error:",
        err
      );

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

    const handleReactionUpdate = ({
      messageId,
      reactions = [],
      conversationId: reactionConversationId,
    }) => {
      if (
        Number(reactionConversationId) !==
        conversationNumber
      ) {
        return;
      }

      setMessages((previous) =>
        previous.map((message) =>
          Number(message.id) === Number(messageId)
            ? {
                ...message,
                reactions,
              }
            : message
        )
      );
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

    socket.on(
      "messageReactionUpdated",
      handleReactionUpdate
    );

    socket.on("userTyping", handleTyping);

    socket.on(
      "presenceSnapshot",
      handlePresenceSnapshot
    );

    socket.on(
      "presenceUpdate",
      handlePresenceUpdate
    );
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

      socket.off(
        "messageReactionUpdated",
        handleReactionUpdate
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
    chatUser.id
  ]);

  async function sendMessage(message, replyToMessageId = null) {
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
            reply_to_message_id: replyToMessageId || null,
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
    <div className="fixed inset-0 z-[60] flex min-h-0 w-full flex-col overflow-hidden bg-[#efeae2]">
      <header className="z-30 flex min-h-[60px] shrink-0 items-center gap-1.5 bg-[#075e54] px-1.5 py-2 text-white shadow-md sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-white/10 active:scale-95 sm:w-10"
          aria-label="Back to chats"
        >
          ←
        </button>

        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold sm:h-10 sm:w-10">
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

        <VoiceCall
          conversationId={conversationId}
          otherUserId={chatUser.id}
          otherUserName={chatUser.name}
        />

        <VideoCall
          conversationId={conversationId}
          otherUserId={chatUser.id}
          otherUserName={chatUser.name}
        />

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setShowMoreOptions((open) => !open)
            }
            className="flex h-10 w-9 items-center justify-center rounded-full text-lg transition hover:bg-white/10 active:scale-95 sm:w-10"
            title="More options"
            aria-label="More options"
            aria-expanded={showMoreOptions}
          >
            ⋮
          </button>

          {showMoreOptions && (
            <div className="absolute right-0 top-12 z-[80] w-56 overflow-hidden rounded-2xl bg-white py-1 text-sm text-gray-800 shadow-2xl ring-1 ring-black/10">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="font-semibold text-gray-900">
                  Conversation options
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  PropertyNestHomes chat
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowMoreOptions(false);
                  setError("");
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                ℹ️
                <span className="ml-3">
                  Conversation info
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowMoreOptions(false)
                }
                className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                ✕
                <span className="ml-3">
                  Close menu
                </span>
              </button>
            </div>
          )}
        </div>
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

      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          loading={loading}
          otherUserName={chatUser.name}
          onReply={(message) => {
            setReplyingTo(message);
          }}
          onReact={reactToMessage}
        />

        <MessageInput
          onSend={async (message, replyToMessageId) => {
            await sendMessage(message, replyToMessageId);
            setReplyingTo(null);
          }}
          conversationId={conversationId}
          disabled={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </main>
    </div>
  );
}
