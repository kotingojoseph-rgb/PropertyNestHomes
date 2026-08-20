import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket, {
  connectSocket,
  disconnectSocket,
} from "../socket";

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function Icon({ children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
    >
      {children}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-4.5a7.5 7.5 0 0 1 8.5-10.4A7.5 7.5 0 0 1 20 11.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M5 12h13" strokeLinecap="round" />
      <path
        d="m13 6 6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        d="M20 11a8.1 8.1 0 0 0-14.8-4.5L4 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 4v4h4" strokeLinecap="round" />
      <path
        d="M4 13a8.1 8.1 0 0 0 14.8 4.5L20 16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 20v-4h-4" strokeLinecap="round" />
    </svg>
  );
}

function PersonAvatar({ name }) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
      {getInitials(name)}
    </div>
  );
}

export default function ChatCenter() {
  const [conversations, setConversations] = useState([]);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] =
    useState(true);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [startingConversation, setStartingConversation] =
    useState(null);
  const [error, setError] = useState("");

  // New-message popup
  const [messageNotification, setMessageNotification] =
    useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  async function loadConversations() {
    if (!token) {
      setLoadingConversations(false);
      return;
    }

    try {
      setLoadingConversations(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load conversations."
        );
      }

      setConversations(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Load conversations error:", err);

      setConversations([]);

      setError(
        err.message || "Unable to load conversations."
      );
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadPeople(searchValue = "") {
    if (!token) return;

    try {
      setLoadingPeople(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/people?search=${encodeURIComponent(
          searchValue
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load people."
        );
      }

      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load people error:", err);
      setPeople([]);
    } finally {
      setLoadingPeople(false);
    }
  }

  // ----------------------------------------------------------
  // LOAD DATA + CONNECT SOCKET
  // ----------------------------------------------------------

  useEffect(() => {
    loadConversations();
    loadPeople();

    if (!token) {
      return undefined;
    }

    connectSocket();

    function handleNewMessageNotification(notification) {
      console.log(
        "📩 NEW MESSAGE NOTIFICATION:",
        notification
      );

      if (!notification) return;

      // Show popup
      setMessageNotification(notification);

      // Refresh conversations so the latest message
      // immediately appears in the conversation list.
      loadConversations();

      // Automatically close popup after 5 seconds.
      window.setTimeout(() => {
        setMessageNotification((current) => {
          if (
            current?.messageId ===
            notification?.messageId
          ) {
            return null;
          }

          return current;
        });
      }, 5000);
    }

    function handleConversationUpdated() {
      console.log(
        "🔄 Conversation list update received"
      );

      loadConversations();
    }

    socket.on(
      "newMessageNotification",
      handleNewMessageNotification
    );

    socket.on(
      "conversationUpdated",
      handleConversationUpdated
    );

    return () => {
      socket.off(
        "newMessageNotification",
        handleNewMessageNotification
      );

      socket.off(
        "conversationUpdated",
        handleConversationUpdated
      );

      disconnectSocket();
    };
  }, []);

  // ----------------------------------------------------------
  // PEOPLE SEARCH
  // ----------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPeople(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // ----------------------------------------------------------
  // START CONVERSATION
  // ----------------------------------------------------------

  async function startConversation(person) {
    if (!person?.id || startingConversation) return;

    try {
      setStartingConversation(person.id);
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            property_id: null,
            seller_id: person.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start conversation."
        );
      }

      navigate(`/chat/${data.id}`);
    } catch (err) {
      console.error(
        "Start conversation error:",
        err
      );

      setError(
        err.message ||
          "Unable to start conversation."
      );
    } finally {
      setStartingConversation(null);
    }
  }

  // ----------------------------------------------------------
  // FILTER CONVERSATIONS
  // ----------------------------------------------------------

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return conversations;

    return conversations.filter((chat) => {
      const name =
        chat.other_user_name ||
        chat.buyer_name ||
        chat.seller_name ||
        "Conversation";

      const message =
        chat.last_message || "";

      return `${name} ${message}`
        .toLowerCase()
        .includes(value);
    });
  }, [conversations, search]);

  // ----------------------------------------------------------
  // NOT LOGGED IN
  // ----------------------------------------------------------

  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <MessageIcon />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Sign in to Messages
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to your PropertyNestHomes account to
            view your conversations and contact other users.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // MAIN PAGE
  // ----------------------------------------------------------

  return (
    <div className="min-h-[calc(100vh-64px)] min-w-0 overflow-x-hidden bg-slate-50">

      {/* ======================================================
          NEW MESSAGE POPUP
          ====================================================== */}

      {messageNotification && (
        <div
          className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6"
          role="alert"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => {
                const conversationId =
                  messageNotification.conversationId;

                setMessageNotification(null);

                if (conversationId) {
                  navigate(
                    `/chat/${conversationId}`
                  );
                }
              }}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              {/* Sender avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-sm font-bold text-white">
                {getInitials(
                  messageNotification.senderName ||
                    "User"
                )}
              </div>

              {/* Notification content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {messageNotification.senderName ||
                      "New message"}
                  </p>

                  <span className="shrink-0 text-[10px] font-medium text-slate-400">
                    Now
                  </span>
                </div>

                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {messageNotification.message ||
                    (messageNotification.mediaType ===
                    "audio"
                      ? "🎤 Voice message"
                      : messageNotification.mediaType ===
                        "video"
                      ? "🎥 Video message"
                      : messageNotification.mediaType ===
                        "image"
                      ? "📷 Photo"
                      : "New message")}
                </p>

                <p className="mt-2 text-xs font-semibold text-[#075e54]">
                  Tap to open conversation
                </p>
              </div>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() =>
                setMessageNotification(null)
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-7 lg:px-8">

        {/* ====================================================
            PAGE HEADING
            ==================================================== */}

        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              PropertyNestHomes
            </p>

            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Messages
            </h1>

            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Connect with buyers, sellers and property users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadConversations();
              loadPeople(search);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            title="Refresh messages"
            aria-label="Refresh messages"
          >
            <RefreshIcon />
          </button>
        </div>

        {/* ====================================================
            SEARCH
            ==================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:mb-7 sm:p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <Icon className="text-slate-400">
              <SearchIcon />
            </Icon>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search conversations or people..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-slate-400 hover:bg-white hover:text-slate-700"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* ====================================================
            MAIN CONTENT
            ==================================================== */}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)] lg:items-start">

          {/* ==================================================
              CONVERSATIONS
              ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Conversations
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Your recent messages
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {filteredConversations.length}
              </span>
            </div>

            {loadingConversations ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-4 sm:px-5"
                  >
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-100" />

                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-48 max-w-full animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <MessageIcon />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {search
                    ? "No matching conversations"
                    : "No conversations yet"}
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-slate-500">
                  {search
                    ? "Try another name or message."
                    : "Start a conversation with someone from the People section."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredConversations.map((chat) => {
                  const name =
                    chat.other_user_name ||
                    chat.buyer_name ||
                    chat.seller_name ||
                    "Conversation";

                  const unread =
                    Number(chat.unread_count || 0) > 0;

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() =>
                        navigate(`/chat/${chat.id}`)
                      }
                      className="group flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 active:bg-slate-100 sm:gap-4 sm:px-5"
                    >
                      <div className="relative shrink-0">
                        <PersonAvatar name={name} />

                        {unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`min-w-0 flex-1 truncate text-sm ${
                              unread
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-800"
                            }`}
                          >
                            {name}
                          </h3>

                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatTime(
                              chat.updated_at ||
                                chat.last_message_at ||
                                chat.created_at
                            )}
                          </span>
                        </div>

                        <p
                          className={`mt-1 truncate text-xs sm:text-sm ${
                            unread
                              ? "font-medium text-slate-700"
                              : "text-slate-500"
                          }`}
                        >
                          {chat.last_message ||
                            "No messages yet"}
                        </p>
                      </div>

                      <Icon className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500">
                        <ArrowRightIcon />
                      </Icon>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ==================================================
              PEOPLE
              ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    People
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Find someone to message
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {people.length}
                </span>
              </div>
            </div>

            {loadingPeople ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-4 sm:px-5"
                  >
                    <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />

                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : people.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <SearchIcon />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No people found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching for another user.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {people.map((person) => {
                  const name =
                    person.full_name ||
                    "PropertyNestHomes User";

                  const isStarting =
                    startingConversation === person.id;

                  return (
                    <div
                      key={person.id}
                      className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <PersonAvatar name={name} />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-slate-800">
                          {name}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {person.email ||
                            "PropertyNestHomes user"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={Boolean(startingConversation)}
                        onClick={() =>
                          startConversation(person)
                        }
                        className="flex h-9 w-[88px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto sm:px-3.5"
                      >
                        {isStarting ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                            <span className="hidden sm:inline">
                              Opening
                            </span>
                          </>
                        ) : (
                          <>
                            <MessageIcon />

                            <span className="hidden sm:inline">
                              Message
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
