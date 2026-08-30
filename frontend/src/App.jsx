import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Status from "./pages/Status";
import socket, { connectSocket } from "./socket";

import Home from "./pages/Home";
import Buy from "./pages/Buy";
import PropertyDetails from "./pages/PropertyDetails";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AddProperty from "./pages/AddProperty";

import Chat from "./pages/Chat";
import ChatCenter from "./pages/ChatCenter";
import Calls from "./pages/Calls";
import InvestorDashboard from "./pages/InvestorDashboard";
import AdminInvestments from "./pages/AdminInvestments";

function MessageNotificationPopup({
  notification,
  onClose,
  onOpen,
}) {
  if (!notification) {
    return null;
  }

  const mediaType =
    notification.mediaType || "text";

  const replyTo =
    notification.replyTo || null;

  function getMessageText(message, type) {
    if (message?.trim()) {
      return message.trim();
    }

    switch (type) {
      case "audio":
        return "🎤 Voice message";

      case "video":
        return "🎥 Video message";

      case "image":
        return "📷 Photo";

      case "document":
        return "📄 Document";

      default:
        return "New message";
    }
  }

  const messageText = getMessageText(
    notification.message,
    mediaType
  );

  const replyText = replyTo
    ? getMessageText(
        replyTo.message,
        replyTo.media_type
      )
    : "";

  return (
    <div
      style={{
        position: "fixed",
        top: "max(14px, env(safe-area-inset-top))",
        left: "12px",
        right: "12px",
        width: "auto",
        maxWidth: "420px",
        marginLeft: "auto",
        zIndex: 99999,
        animation:
          "propertyNestMessagePopupIn 220ms ease-out",
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "18px",
          padding: "14px",
          background: "#ffffff",
          color: "#111827",
          boxShadow:
            "0 16px 45px rgba(0,0,0,0.22)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "11px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              minWidth: "44px",
              borderRadius: "50%",
              background: "#dc2626",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "19px",
              fontWeight: "700",
            }}
          >
            💬
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#dc2626",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              New message
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "15px",
                fontWeight: "700",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {notification.senderName ||
                "PropertyNestHomes User"}
            </div>
          </div>

          <span
            role="button"
            tabIndex={0}
            aria-label="Close notification"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                event.stopPropagation();
                onClose();
              }
            }}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f3f4f6",
              color: "#6b7280",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            ×
          </span>
        </div>

        {replyTo && (
          <div
            style={{
              marginTop: "12px",
              marginLeft: "55px",
              padding: "8px 10px",
              borderLeft:
                "4px solid #128c7e",
              borderRadius: "8px",
              background: "#f3f4f6",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#075e54",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              ↩ Replying to{" "}
              {replyTo.sender_name ||
                "message"}
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "12px",
                color: "#6b7280",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {replyText}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "10px",
            marginLeft: "55px",
            fontSize: "14px",
            color: "#374151",
            lineHeight: "1.45",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {messageText}
        </div>

        <div
          style={{
            marginTop: "10px",
            marginLeft: "55px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#dc2626",
          }}
        >
          Tap to open conversation
        </div>
      </button>

      <style>
        {`
          @keyframes propertyNestMessagePopupIn {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();

  const [notification, setNotification] =
    useState(null);

  /*
   * Ask the browser for notification permission.
   */
  useEffect(() => {
    if (!("Notification" in window)) {
      console.log(
        "Browser notifications are not supported."
      );
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then((permission) => {
          console.log(
            "🔔 Notification permission:",
            permission
          );
        })
        .catch((error) => {
          console.error(
            "Notification permission error:",
            error
          );
        });
    }
  }, []);

  /*
   * Connect to Socket.IO and listen for new messages.
   */
  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    connectSocket();

    const handleNewMessageNotification = (
      incomingNotification
    ) => {
      if (!incomingNotification) {
        return;
      }

      /*
       * Get the currently logged-in user.
       */
      let currentUserId = 0;

      try {
        const storedUser =
          localStorage.getItem("user");

        if (storedUser) {
          const user =
            JSON.parse(storedUser);

          currentUserId = Number(
            user?.id ||
              user?.user_id ||
              user?.userId ||
              0
          );
        }
      } catch (error) {
        console.error(
          "Unable to read logged-in user:",
          error
        );
      }

      /*
       * Do not show our own message
       * as a notification.
       */
      if (
        currentUserId &&
        Number(
          incomingNotification.senderId
        ) === currentUserId
      ) {
        return;
      }

      console.log(
        "🔔 RECEIVED MESSAGE NOTIFICATION:",
        incomingNotification
      );

      /*
       * Show the PropertyNestHomes popup.
       */
      setNotification(
        incomingNotification
      );

      /*
       * Show a browser/device notification
       * if permission has been granted.
       */
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const notificationTitle =
          incomingNotification.senderName ||
          "PropertyNestHomes";

        let notificationBody =
          incomingNotification.message?.trim();

        if (!notificationBody) {
          switch (
            incomingNotification.mediaType
          ) {
            case "audio":
              notificationBody =
                "🎤 Voice message";
              break;

            case "video":
              notificationBody =
                "🎥 Video message";
              break;

            case "image":
              notificationBody =
                "📷 Photo";
              break;

            case "document":
              notificationBody =
                "📄 Document";
              break;

            default:
              notificationBody =
                "New message";
          }
        }

        try {
          const phoneNotification =
            new Notification(
              notificationTitle,
              {
                body: notificationBody,
                icon: "/favicon.ico",
                tag: `propertynest-chat-${incomingNotification.conversationId}`,
              }
            );

          phoneNotification.onclick = () => {
            window.focus();

            if (
              incomingNotification.conversationId
            ) {
              navigate(
                `/chat/${incomingNotification.conversationId}`
              );
            } else {
              navigate("/chat");
            }

            phoneNotification.close();
          };
        } catch (error) {
          console.error(
            "Unable to create browser notification:",
            error
          );
        }
      }

      /*
       * Keep the popup visible for 6 seconds.
       */
      window.clearTimeout(
        window.__propertyNestMessagePopupTimer
      );

      window.__propertyNestMessagePopupTimer =
        window.setTimeout(() => {
          setNotification(null);
        }, 6000);
    };

    socket.on(
      "newMessageNotification",
      handleNewMessageNotification
    );

    return () => {
      socket.off(
        "newMessageNotification",
        handleNewMessageNotification
      );

      window.clearTimeout(
        window.__propertyNestMessagePopupTimer
      );
    };
  }, [navigate]);

  const openNotification = () => {
    if (!notification) {
      return;
    }

    const conversationId =
      notification.conversationId;

    setNotification(null);

    if (conversationId) {
      navigate(
        `/chat/${conversationId}`
      );
    } else {
      navigate("/chat");
    }
  };

  return (
    <>
      <MessageNotificationPopup
        notification={notification}
        onClose={() =>
          setNotification(null)
        }
        onOpen={openNotification}
      />

      <Routes>
        {/* Public Routes */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/buy"
          element={<Buy />}
        />

        <Route
          path="/property/:id"
          element={<PropertyDetails />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Chat */}

        <Route
          path="/status"
          element={
            <ProtectedRoute>
              <Status />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={<ChatCenter />}
        />

        <Route
          path="/calls"
          element={
            <ProtectedRoute>
              <Calls />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:conversationId"
          element={<Chat />}
        />

        {/* Protected Routes */}

        <Route
          path="/add-property"
          element={
            <ProtectedRoute>
              <AddProperty />
            </ProtectedRoute>
          }
        />

        <Route
          path="/investments"
          element={
            <ProtectedRoute>
              <InvestorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/investments"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminInvestments />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <MainLayout>
      <AppContent />
    </MainLayout>
  );
}
