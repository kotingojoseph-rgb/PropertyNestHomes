import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("❌ VITE_API_URL is not configured");
}

const socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  console.log("✅ Socket.IO connected:", socket.id);
  console.log("🔐 Socket auth:", socket.auth ? "present" : "missing");
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
});

export function connectSocket() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("⚠️ Cannot connect socket: no authentication token");
    return;
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;
