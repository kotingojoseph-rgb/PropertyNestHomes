import { useLocation, useNavigate } from "react-router-dom";

function ChatIcon({ active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

function StatusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function CallsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        d="M6.6 3.8 9 3.2c.7-.2 1.4.2 1.7.8l1.1 2.7c.2.5.1 1.1-.3 1.5L10 9.8a13.2 13.2 0 0 0 4.2 4.2l1.6-1.5c.4-.4 1-.5 1.5-.3l2.7 1.1c.7.3 1 .9.8 1.7l-.6 2.4c-.2.8-.9 1.4-1.7 1.4C10.2 18.8 5.2 13.8 5.2 5.5c0-.8.6-1.5 1.4-1.7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const tabs = [
  {
    label: "Chats",
    path: "/chat",
    icon: ChatIcon,
  },
  {
    label: "Status",
    path: "/status",
    icon: StatusIcon,
  },
  {
    label: "Calls",
    path: "/calls",
    icon: CallsIcon,
  },
];

export default function ChatTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = location.pathname.startsWith("/chat/")
    ? "/chat"
    : location.pathname;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl">
        {tabs.map((tab) => {
          const active = activePath === tab.path;
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`relative flex min-h-[60px] flex-1 items-center justify-center gap-2 px-3 text-sm font-semibold transition ${
                active
                  ? "text-[#075e54]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon active={active} />

              <span>{tab.label}</span>

              {active && (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-16 -translate-x-1/2 rounded-t-full bg-[#075e54]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
