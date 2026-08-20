import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
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

function MessageNotificationPopup({
  notification,
  onClose,
  onOpen,
}) {
  if (!notification) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "min(380px, calc(100vw - 40px))",
        zIndex: 99999,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",
          border: "none",
          borderRadius: "16px",
          padding: "16px",
          background: "#ffffff",
          color: "#111827",
          boxShadow: "0 15px 45px rgba(0,0,0,0.22)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                minWidth: "42px",
                borderRadius: "50%",
                background: "#dc2626",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "700",
              }}
            >
              💬
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#dc2626",
                  marginBottom: "3px",
                }}
              >
                New message
              </div>

              <div
                style={{
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

        <div
          style={{
            marginTop: "12px",
            paddingLeft: "52px",
            fontSize: "14px",
            color: "#4b5563",
            lineHeight: "1.45",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {notification.message ||
            "You received a new message."}
        </div>

        <div
          style={{
            marginTop: "12px",
            paddingLeft: "52px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#dc2626",
          }}
        >
          Tap to open conversation
        </div>
      </button>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();

  const [notification, setNotification] =
    useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

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
       * The logged-in user is stored by Login.jsx as:
       *
       * localStorage.setItem(
       *   "user",
       *   JSON.stringify(data.user)
       * );
       *
       * Therefore we read the user object here.
       */
      let currentUserId = 0;

      try {
        const storedUser =
          localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);

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
       * Do not show a notification for our own message.
       */
      if (
        currentUserId &&
        Number(incomingNotification.senderId) ===
          currentUserId
      ) {
        return;
      }

      console.log(
        "🔔 New message notification:",
        incomingNotification
      );

      setNotification(incomingNotification);

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
  }, []);

  const openNotification = () => {
    if (!notification) {
      return;
    }

    const conversationId =
      notification.conversationId;

    setNotification(null);

    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else {
      navigate("/chat");
    }
  };

  return (
    <>
      <MessageNotificationPopup
        notification={notification}
        onClose={() => setNotification(null)}
        onOpen={openNotification}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />

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
          path="/chat"
          element={<ChatCenter />}
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
