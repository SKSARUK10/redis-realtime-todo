require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/redis_todo";

(async () => {
  // Connect to DB
  await connectDB(MONGO_URI);

  // Create server
  const server = createServer(app);

  // Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  // Create Redis subscriber (duplicate connection)
  try {
    const sub = redisClient.duplicate();
    await sub.connect();
    await sub.subscribe("tasks", (message) => {
      try {
        const payload = JSON.parse(message);
        // broadcast to all connected clients
        io.emit("task-update", payload);
      } catch (err) {
        console.error("Failed to parse pubsub message", err);
      }
    });
    console.log("✅ Subscribed to Redis 'tasks' channel");
  } catch (err) {
    console.error("❌ Redis subscription failed", err);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
