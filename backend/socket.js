const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("./config/db");

let io;

async function updatePresence(userId, online) {
  try {
    await pool.query(
      `
      INSERT INTO user_presence
      (
        user_id,
        online,
        last_seen
      )
      VALUES
      (
        $1,
        $2,
        CURRENT_TIMESTAMP
      )

      ON CONFLICT(user_id)
      DO UPDATE SET
        online = EXCLUDED.online,
        last_seen = CURRENT_TIMESTAMP
      `,
      [userId, online]
    );
  } catch (error) {
    console.error("Presence update error:", error);
  }
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://propertynesthomes-frontend.onrender.com",
        "https://propertynesthomes.onrender.com",
      ],
      credentials: true,
    },
  });

  /*
   * Socket Authentication
   */

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.user = decoded;

      next();

    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {

    console.log(
      `🟢 ${socket.user.full_name || socket.user.email} connected`
    );

    await updatePresence(
      socket.user.id,
      true
    );

    io.emit("userPresence", {
      userId: socket.user.id,
      online: true,
    });

    /*
     * Secure Conversation Join
     */

    socket.on(
      "joinConversation",
      async (conversationId) => {

        try {

          const result = await pool.query(
            `
            SELECT id
            FROM conversations

            WHERE
            id = $1

            AND
            (
              buyer_id = $2
              OR seller_id = $2
            )
            `,
            [
              conversationId,
              socket.user.id,
            ]
          );

          if (result.rows.length === 0) {

            return socket.emit(
              "socketError",
              {
                message:
                  "Access denied to conversation",
              }
            );

          }

          socket.join(
            `conversation_${conversationId}`
          );

          console.log(
            `User ${socket.user.id} joined conversation ${conversationId}`
          );

        } catch (error) {

          console.error(error);

        }

      }
    );

    /*
     * Disconnect
     */

    socket.on(
      "disconnect",
      async () => {

        console.log(
          `🔴 User ${socket.user.id} disconnected`
        );

        await updatePresence(
          socket.user.id,
          false
        );

        io.emit("userPresence", {
          userId: socket.user.id,
          online: false,
        });

      }
    );

  });

  return io;
}

function getIO() {

  if (!io) {
    throw new Error(
      "Socket.IO not initialized"
    );
  }

  return io;
}

module.exports = {
  initSocket,
  getIO,
};
