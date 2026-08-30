const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("./config/db");

let io = null;

// Track active sockets per user.
// This is important because a user can have multiple tabs/devices open.
const userSockets = new Map();

function getUserSocketCount(userId) {
  return userSockets.get(Number(userId))?.size || 0;
}

function addUserSocket(userId, socketId) {
  const id = Number(userId);

  if (!userSockets.has(id)) {
    userSockets.set(id, new Set());
  }

  userSockets.get(id).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const id = Number(userId);

  const sockets = userSockets.get(id);

  if (!sockets) {
    return 0;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(id);
    return 0;
  }

  return sockets.size;
}

async function setUserOnline(userId, socketId) {
  await pool.query(
    `
    INSERT INTO user_presence
      (user_id, socket_id, is_online, last_seen, updated_at)
    VALUES
      ($1, $2, TRUE, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id)
    DO UPDATE SET
      socket_id = EXCLUDED.socket_id,
      is_online = TRUE,
      updated_at = CURRENT_TIMESTAMP
    `,
    [userId, socketId]
  );
}

async function setUserOffline(userId) {
  await pool.query(
    `
    UPDATE user_presence
    SET
      is_online = FALSE,
      last_seen = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    `,
    [userId]
  );
}

async function getPresence(userId) {
  const result = await pool.query(
    `
    SELECT
      user_id,
      is_online,
      last_seen,
      updated_at
    FROM user_presence
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      userId: Number(userId),
      isOnline: false,
      lastSeen: null,
    };
  }

  const row = result.rows[0];

  return {
    userId: Number(row.user_id),
    isOnline: Boolean(row.is_online),
    lastSeen: row.last_seen,
  };
}

async function broadcastPresence(userId) {
  if (!io) return;

  const presence = await getPresence(userId);

  io.emit("presenceUpdate", presence);
}

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

    transports: ["polling", "websocket"],

    pingInterval: 25000,
    pingTimeout: 20000,
  });

  /*
   * Authenticate every Socket.IO connection.
   */
  io.use((socket, next) => {
    try {
      if (!process.env.JWT_SECRET) {
        return next(
          new Error("JWT_SECRET is not configured")
        );
      }

      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(
          /^Bearer\s+/i,
          ""
        );

      if (!token) {
        return next(
          new Error("Authentication token required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (decoded.type === "2fa_pending") {
        return next(
          new Error(
            "Two-factor authentication required"
          )
        );
      }

      socket.user = decoded;

      next();
    } catch (error) {
      console.error(
        "Socket authentication failed:",
        error.message
      );

      next(
        new Error("Invalid or expired token")
      );
    }
  });

  io.on("connection", async (socket) => {
    const userId = Number(socket.user.id);

    console.log(
      `🔌 Socket connected: user ${userId} (${socket.user.email || "unknown"})`
    );

    /*
     * Diagnose every server-side Socket.IO disconnect.
     * This does not disconnect or reconnect anything.
     */
    socket.on("disconnect", (reason, details) => {
      console.warn(
        `🔴 Socket disconnected: user ${userId} (${socket.id})`,
        {
          reason,
          details: details || null,
          socketConnected: socket.connected,
          transport: socket.conn?.transport?.name || "unknown",
        }
      );
    });

    socket.on("error", (error) => {
      console.error(
        `❌ Socket error: user ${userId} (${socket.id})`,
        error
      );
    });

    /*
     * Every user gets a private room.
     */
    socket.join(`user_${userId}`);

    /*
     * Track socket.
     */
    addUserSocket(userId, socket.id);

    /*
     * Mark user online.
     */
    try {
      await setUserOnline(userId, socket.id);
      await broadcastPresence(userId);
    } catch (error) {
      console.error(
        "Presence online error:",
        error.message
      );
    }

    /*
     * Send the new user the current presence list.
     */
    try {
      const result = await pool.query(`
        SELECT
          user_id,
          is_online,
          last_seen
        FROM user_presence
      `);

      socket.emit(
        "presenceSnapshot",
        result.rows.map((row) => ({
          userId: Number(row.user_id),
          isOnline: Boolean(row.is_online),
          lastSeen: row.last_seen,
        }))
      );
    } catch (error) {
      console.error(
        "Presence snapshot error:",
        error.message
      );
    }

    /*
     * Request one user's current presence.
     */
    socket.on(
      "getUserPresence",
      async (targetUserId) => {
        try {
          const id = Number(targetUserId);

          if (!Number.isInteger(id) || id <= 0) {
            return;
          }

          socket.emit(
            "presenceUpdate",
            await getPresence(id)
          );
        } catch (error) {
          console.error(
            "getUserPresence error:",
            error.message
          );
        }
      }
    );

    /*
     * Join conversation.
     */
    socket.on(
      "joinConversation",
      async (conversationId) => {
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
      }
    );

    /*
     * Typing indicator.
     */
    socket.on(
      "typing",
      async (conversationId) => {
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
      }
    );

    socket.on(
      "stopTyping",
      async (conversationId) => {
        try {
          const id = Number(conversationId);

          if (!Number.isInteger(id) || id <= 0) {
            return;
          }

          socket
            .to(`conversation_${id}`)
            .emit(
              "userStoppedTyping",
              { userId }
            );
        } catch (error) {
          console.error(
            "stopTyping error:",
            error.message
          );
        }
      }
    );

    /*
     * Mark conversation messages as read.
     */
    socket.on(
      "markMessagesRead",
      async (conversationId) => {
        try {
          const id = Number(conversationId);

          if (!Number.isInteger(id) || id <= 0) {
            return;
          }

          const conversation =
            await pool.query(
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

          if (
            conversation.rows.length === 0
          ) {
            return;
          }

          const result = await pool.query(
            `
            UPDATE messages
            SET
              is_read = TRUE,
              read_at = COALESCE(
                read_at,
                CURRENT_TIMESTAMP
              )
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
              .emit(
                "messageStatusUpdate",
                {
                  messageId: row.id,
                  status: "read",
                }
              );
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
     * Mark message delivered.
     */
    socket.on(
      "messageDelivered",
      async ({
        messageId,
        conversationId,
      }) => {
        try {
          const messageIdNumber =
            Number(messageId);

          const conversationIdNumber =
            Number(conversationId);

          if (
            !Number.isInteger(
              messageIdNumber
            ) ||
            !Number.isInteger(
              conversationIdNumber
            )
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

          if (
            Number(message.sender_id) ===
            userId
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
              .to(
                `conversation_${conversationIdNumber}`
              )
              .emit(
                "messageStatusUpdate",
                {
                  messageId:
                    messageIdNumber,
                  status: "delivered",
                }
              );
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
     * =========================
     * WEBRTC CALL SIGNALING
     * =========================
     */

    async function verifyCallAccess(
      conversationId,
      targetUserId
    ) {
      const conversationNumber =
        Number(conversationId);

      const targetNumber =
        Number(targetUserId);

      if (
        !Number.isInteger(conversationNumber) ||
        conversationNumber <= 0 ||
        !Number.isInteger(targetNumber) ||
        targetNumber <= 0
      ) {
        return false;
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
        AND (
          buyer_id = $3
          OR seller_id = $3
        )
        LIMIT 1
        `,
        [
          conversationNumber,
          userId,
          targetNumber,
        ]
      );

      return access.rows.length > 0;
    }

    socket.on(
      "callUser",
      async ({
        userToCall,
        offer,
        conversationId,
        callType = "video",
      }) => {
        try {
          const targetUserId = Number(userToCall);
          const conversationNumber = Number(conversationId);

          const allowed = await verifyCallAccess(
            conversationNumber,
            targetUserId
          );

          if (!allowed) {
            console.warn(
              `⚠️ Call denied: user ${userId} -> user ${targetUserId}, conversation ${conversationNumber}`
            );

            socket.emit("callError", {
              message:
                "You are not authorized to call this user in this conversation.",
              conversationId: conversationNumber,
            });

            return;
          }

          if (!offer) {
            console.warn(
              `⚠️ Call rejected: no WebRTC offer from user ${userId}`
            );
            return;
          }

          const targetRoom = `user_${targetUserId}`;
          const targetSockets =
            io.sockets.adapter.rooms.get(targetRoom);

          console.log("========== FINAL CALL ROUTING ==========");
          console.log("Caller user:", userId);
          console.log("Target user:", targetUserId);
          console.log("Conversation:", conversationNumber);
          console.log("Target room:", targetRoom);
          console.log(
            "Target room exists:",
            Boolean(targetSockets)
          );
          console.log(
            "Target room socket count:",
            targetSockets?.size || 0
          );
          console.log(
            "Target room sockets:",
            targetSockets
              ? Array.from(targetSockets)
              : []
          );
          console.log("========================================");

          /*
           * The Socket.IO user room is authoritative.
           *
           * Every authenticated connection joins:
           * user_<userId>
           *
           * Therefore we route calls through that room instead
           * of relying exclusively on the separate userSockets Map.
           */
          if (!targetSockets || targetSockets.size === 0) {
            console.warn(
              `⚠️ Call target ${targetUserId} has no active Socket.IO connection`
            );

            socket.emit("callError", {
              message:
                "The other user is currently offline.",
              conversationId: conversationNumber,
            });

            return;
          }

          io.to(targetRoom).emit(
            "incomingCall",
            {
              from: userId,
              callerName:
                socket.user.full_name ||
                socket.user.email ||
                "PropertyNestHomes User",
              offer,
              conversationId: conversationNumber,
              callType,
            }
          );

          console.log(
            `📞 CALL OFFER DELIVERED: ${userId} -> ${targetUserId} (${targetSockets.size} socket(s))`
          );
        } catch (error) {
          console.error(
            "callUser error:",
            error
          );

          socket.emit("callError", {
            message:
              "Unable to send the call.",
            conversationId:
              Number(conversationId),
          });
        }
      }
    );

    socket.on(
      "answerCall",
      async ({
        callerId,
        answer,
        conversationId,
        callType = "video",
      }) => {
        try {
          const target =
            Number(callerId);

          const allowed =
            await verifyCallAccess(
              conversationId,
              target
            );

          if (!allowed || !answer) {
            return;
          }

          console.log(
            `📲 CALL ANSWER: ${userId} -> ${target} conversation ${conversationId}`
          );

          io
            .to(`user_${target}`)
            .emit("callAccepted", {
              from: userId,
              answer,
              conversationId:
                Number(conversationId),
              callType,
            });
        } catch (error) {
          console.error(
            "answerCall error:",
            error.message
          );
        }
      }
    );

    socket.on(
      "iceCandidate",
      async ({
        targetUserId,
        candidate,
        conversationId,
      }) => {
        try {
          const target =
            Number(targetUserId);

          const allowed =
            await verifyCallAccess(
              conversationId,
              target
            );

          if (!allowed || !candidate) {
            return;
          }

          io
            .to(`user_${target}`)
            .emit("iceCandidate", {
              from: userId,
              candidate,
              conversationId:
                Number(conversationId),
            });
        } catch (error) {
          console.error(
            "iceCandidate error:",
            error.message
          );
        }
      }
    );

    socket.on(
      "endCall",
      async ({
        targetUserId,
        conversationId,
      }) => {
        try {
          const target =
            Number(targetUserId);

          const allowed =
            await verifyCallAccess(
              conversationId,
              target
            );

          if (!allowed) {
            return;
          }

          console.log(
            `📴 CALL END: ${userId} -> ${target} conversation ${conversationId}`
          );

          io
            .to(`user_${target}`)
            .emit("callEnded", {
              from: userId,
              conversationId:
                Number(conversationId),
            });
        } catch (error) {
          console.error(
            "endCall error:",
            error.message
          );
        }
      }
    );

    /*
     * =========================
     * DISCONNECT / OFFLINE
     * =========================
     */
    socket.on(
      "disconnect",
      async (reason) => {
        console.log(
          `🔌 Socket disconnected: user ${userId} (${reason})`
        );

        const remaining =
          removeUserSocket(
            userId,
            socket.id
          );

        /*
         * User still has another tab/device.
         * Keep them online.
         */
        if (remaining > 0) {
          return;
        }

        try {
          await setUserOffline(userId);

          await broadcastPresence(
            userId
          );
        } catch (error) {
          console.error(
            "Presence offline error:",
            error.message
          );
        }
      }
    );
  });

  console.log(
    "✅ Socket.IO initialized with real-time presence"
  );

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
