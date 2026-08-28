import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("❌ VITE_API_URL is not configured");
}

const socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  console.log("✅ Socket.IO connected:", socket.id);
});

socket.on("incomingCall", (data) => {
  console.log("📲 GLOBAL incomingCall RECEIVED:", data);
});

socket.on("callAccepted", (data) => {
  console.log("📲 GLOBAL callAccepted RECEIVED:", data);
});

socket.on("iceCandidate", (data) => {
  console.log("🧊 GLOBAL iceCandidate RECEIVED:", data);
});

socket.on("callEnded", (data) => {
  console.log("📴 GLOBAL callEnded RECEIVED:", data);
});

socket.on("callError", (data) => {
  console.error("❌ GLOBAL callError RECEIVED:", data);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket.IO disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket.IO connection error:", error.message);

  /*
   * The server rejected the JWT.
   * Stop reconnecting with a bad token and clear
   * the local authentication session.
   */
  if (
    error.message === "Invalid or expired token" ||
    error.message === "Authentication token required" ||
    error.message === "Two-factor authentication required"
  ) {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    console.warn(
      "🔐 Invalid authentication session cleared. Please log in again."
    );
  }
});

export function connectSocket() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn(
      "⚠️ Cannot connect socket: no authentication token"
    );

    return Promise.reject(
      new Error("Authentication token is missing.")
    );
  }

  /*
   * Always take the latest token from localStorage.
   */
  socket.auth = {
    token,
  };

  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    const handleConnect = () => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve();
    };

    const handleError = (error) => {
      if (settled) return;

      settled = true;
      cleanup();
      reject(error);
    };

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleError);

    socket.connect();
  });
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;
