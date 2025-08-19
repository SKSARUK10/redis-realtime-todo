const Redis = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = Redis.createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("❌ Redis connection failed", err);
  }
})();

module.exports = redisClient;
