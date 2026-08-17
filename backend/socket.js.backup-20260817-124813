const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("./config/db");

let io = null;

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

  io.use((socket, next) => {
    try {
      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT_SECRET is not configured"));
      }

      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(
          /^Bearer\s+/i,
          ""
        );

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (decoded.type === "2fa_pending") {
        return next(
          new Error("Two-factor authentication required")
        );
      }

      socket.user = decoded;

      next();
    } catch (error) {
      console.error(
        "Socket authentication failed:",
        error.message
      );

      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = Number(socket.user.id);

    console.log(
      `🔌 Socket connected: user ${userId} (${socket.user.email || "unknown"})`
    );

    /*
     * Private user room.
     */
    socket.join(`user_${userId}`);

    /*
     * Join conversation.
     */
    socket.on("joinConversation", async (conversationId) => {
      try {
        const id = Number(conversationId);

        if (!Number.isInteger(id) || id <= 0) {
          return;
        }

        const access = await pool.query(
          `
          SELECT id
          FROM conversations
          WHERE id = $1
          AND (
            buyer_id = $2
            OR seller_id = $2
          )
          LIMIT 1
          `,
          [id, userId]
        );

        if (access.rows.length === 0) {
          console.warn(
            `⚠️ User ${userId} denied conversation ${id}`
          );
          return;
        }

        socket.join(`conversation_${id}`);

        console.log(
          `💬 User ${userId} joined conversation ${id}`
        );
      } catch (error) {
        console.error(
          "joinConversation error:",
          error.message
        );
      }
    });

    /*
     * Typing indicator.
     */
    socket.on("typing", async (conversationId) => {
      try {
        const id = Number(conversationId);

        if (!Number.isInteger(id)) {
          return;
        }

        const access = await pool.query(
          `
          SELECT buyer_id, seller_id
          FROM conversations
          WHERE id = $1
          AND (
            buyer_id = $2
            OR seller_id = $2
          )
          LIMIT 1
          `,
          [id, userId]
        );

        if (access.rows.length === 0) {
          return;
        }

        socket
          .to(`conversation_${id}`)
          .emit("userTyping", {
            userId,
          });
      } catch (error) {
        console.error(
          "typing error:",
          error.message
        );
      }
    });

    /*
     * Stop typing.
     */
    socket.on("stopTyping", async (conversationId) => {
      try {
        const id = Number(conversationId);

        if (!Number.isInteger(id)) {
          return;
        }

        socket
          .to(`conversation_${id}`)
          .emit("userStoppedTyping", {
            userId,
          });
      } catch (error) {
        console.error(
          "stopTyping error:",
          error.message
        );
      }
    });

    /*
     * Mark messages in a conversation as read.
     */
    socket.on(
      "markMessagesRead",
      async (conversationId) => {
        try {
          const id = Number(conversationId);

          if (!Number.isInteger(id) || id <= 0) {
            return;
          }

          const conversation = await pool.query(
            `
            SELECT buyer_id, seller_id
            FROM conversations
            WHERE id = $1
            AND (
              buyer_id = $2
              OR seller_id = $2
            )
            LIMIT 1
            `,
            [id, userId]
          );

          if (conversation.rows.length === 0) {
            return;
          }

          const result = await pool.query(
            `
            UPDATE messages
            SET
              is_read = TRUE,
              read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
            WHERE conversation_id = $1
            AND sender_id <> $2
            AND read_at IS NULL
            RETURNING id
            `,
            [id, userId]
          );

          for (const row of result.rows) {
            io
              .to(`conversation_${id}`)
              .emit("messageStatusUpdate", {
                messageId: row.id,
                status: "read",
              });
          }
        } catch (error) {
          console.error(
            "markMessagesRead error:",
            error.message
          );
        }
      }
    );

    /*
     * Mark a specific message as delivered.
     */
    socket.on(
      "messageDelivered",
      async ({ messageId, conversationId }) => {
        try {
          const messageIdNumber = Number(messageId);
          const conversationIdNumber = Number(
            conversationId
          );

          if (
            !Number.isInteger(messageIdNumber) ||
            !Number.isInteger(conversationIdNumber)
          ) {
            return;
          }

          const access = await pool.query(
            `
            SELECT
              m.id,
              m.sender_id
            FROM messages m
            JOIN conversations c
              ON c.id = m.conversation_id
            WHERE m.id = $1
            AND m.conversation_id = $2
            AND (
              c.buyer_id = $3
              OR c.seller_id = $3
            )
            LIMIT 1
            `,
            [
              messageIdNumber,
              conversationIdNumber,
              userId,
            ]
          );

          if (access.rows.length === 0) {
            return;
          }

          const message = access.rows[0];

          /*
           * Do not mark our own message as delivered
           * from the receiving client.
           */
          if (
            Number(message.sender_id) === userId
          ) {
            return;
          }

          const updated = await pool.query(
            `
            UPDATE messages
            SET delivered_at =
              COALESCE(
                delivered_at,
                CURRENT_TIMESTAMP
              )
            WHERE id = $1
            RETURNING id
            `,
            [messageIdNumber]
          );

          if (updated.rows.length > 0) {
            io
              .to(`conversation_${conversationIdNumber}`)
              .emit("messageStatusUpdate", {
                messageId: messageIdNumber,
                status: "delivered",
              });
          }
        } catch (error) {
          console.error(
            "messageDelivered error:",
            error.message
          );
        }
      }
    );

    /*
     * WebRTC video-call signaling.
     */
    socket.on(
      "callUser",
      ({ userToCall, offer, conversationId }) => {
        if (!userToCall || !offer) {
          return;
        }

        io.to(`user_${Number(userToCall)}`).emit(
          "incomingCall",
          {
            from: userId,
            callerName:
              socket.user.full_name ||
              socket.user.email ||
              "PropertyNestHomes User",
            offer,
            conversationId,
          }
        );
      }
    );

    socket.on(
      "answerCall",
      ({ callerId, answer, conversationId }) => {
        if (!callerId || !answer) {
          return;
        }

        io.to(`user_${Number(callerId)}`).emit(
          "callAccepted",
          {
            from: userId,
            answer,
            conversationId,
          }
        );
      }
    );

    socket.on(
      "iceCandidate",
      ({
        targetUserId,
        candidate,
        conversationId,
      }) => {
        if (!targetUserId || !candidate) {
          return;
        }

        io.to(`user_${Number(targetUserId)}`).emit(
          "iceCandidate",
          {
            from: userId,
            candidate,
            conversationId,
          }
        );
      }
    );

    socket.on(
      "endCall",
      ({ targetUserId, conversationId }) => {
        if (!targetUserId) {
          return;
        }

        io.to(`user_${Number(targetUserId)}`).emit(
          "callEnded",
          {
            from: userId,
            conversationId,
          }
        );
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Socket disconnected: user ${userId} (${reason})`
      );
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
}

function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
}

module.exports = {
  initSocket,
  getIO,
};
