import { useNavigate } from "react-router-dom";
import ChatTabs from "../components/chat/ChatTabs";

function PhoneIcon({ incoming = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-5 w-5 ${
        incoming ? "rotate-[135deg]" : ""
      }`}
    >
      <path
        d="M6.6 3.8 9 3.2c.7-.2 1.4.2 1.7.8l1.1 2.7c.2.5.1 1.1-.3 1.5L10 9.8a13.2 13.2 0 0 0 4.2 4.2l1.6-1.5c.4-.4 1-.5 1.5-.3l2.7 1.1c.7.3 1 .9.8 1.7l-.6 2.4c-.2.8-.9 1.4-1.7 1.4C10.2 18.8 5.2 13.8 5.2 5.5c0-.8.6-1.5 1.4-1.7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

export default function Calls() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ChatTabs />

        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">
              Sign in to Calls
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to make and receive calls.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-5 rounded-xl bg-[#075e54] px-5 py-3 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <ChatTabs />

      <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-7">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <h1 className="text-lg font-bold text-slate-900">
              Calls
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Your recent voice and video calls
            </p>
          </div>

          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5e9] text-[#075e54]">
              <PhoneIcon />
            </div>

            <h2 className="mt-5 text-base font-bold text-slate-900">
              No recent calls
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Your voice and video call history will appear here.
              Open a conversation to start a call.
            </p>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#075e54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#064e46]"
            >
              <PhoneIcon />
              Open Chats
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
