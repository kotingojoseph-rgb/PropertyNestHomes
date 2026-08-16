const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

/*
 * Initialize Socket.IO on the existing HTTP server.
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://propertynesthomes-frontend.onrender.com",
        "https://propertynesthomes.onrender.com",
        "https://propertynesthomes.com",
        "https://www.propertynesthomes.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /*
   * Authenticate Socket.IO connections using the same JWT
   * used by the REST API.
   */
  io.use((socket, next) => {
    try {
      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT_SECRET is not configured"));
      }

      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type === "2fa_pending") {
        return next(new Error("Two-factor authentication required"));
      }

      socket.user = decoded;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `🔌 Socket connected: user ${socket.user.id} (${socket.user.email || "unknown"})`
    );

    /*
     * Register this socket in a private user room.
     */
    socket.join(`user_${socket.user.id}`);

    /*
     * WebRTC Video Call Signaling
     */

    socket.on(
      "callUser",
      ({ userToCall, offer, conversationId }) => {
        if (!userToCall || !offer) {
          return;
        }

        io.to(`user_${userToCall}`).emit("incomingCall", {
          from: socket.user.id,
          callerName:
            socket.user.full_name ||
            socket.user.email ||
            "PropertyNestHomes User",
          offer,
          conversationId,
        });
      }
    );

    socket.on(
      "answerCall",
      ({ callerId, answer, conversationId }) => {
        if (!callerId || !answer) {
          return;
        }

        io.to(`user_${callerId}`).emit("callAccepted", {
          from: socket.user.id,
          answer,
          conversationId,
        });
      }
    );

    socket.on(
      "iceCandidate",
      ({ targetUserId, candidate, conversationId }) => {
        if (!targetUserId || !candidate) {
          return;
        }

        io.to(`user_${targetUserId}`).emit("iceCandidate", {
          from: socket.user.id,
          candidate,
          conversationId,
        });
      }
    );

    socket.on(
      "endCall",
      ({ targetUserId, conversationId }) => {
        if (!targetUserId) {
          return;
        }

        io.to(`user_${targetUserId}`).emit("callEnded", {
          from: socket.user.id,
          conversationId,
        });
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Socket disconnected: user ${socket.user.id} (${reason})`
      );
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
}

/*
 * Access the initialized Socket.IO instance from controllers.
 */
function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}

module.exports = {
  initSocket,
  getIO,
};
