const redis = require("../config/redis");

async function setCache(key, value, ttlSeconds = 120) {
  if (!key) return;
  const v = JSON.stringify(value);
  await redis.set(key, v, { EX: ttlSeconds });
}

async function getCache(key) {
  if (!key) return null;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function delCache(key) {
  if (!key) return;
  await redis.del(key);
}

module.exports = { setCache, getCache, delCache };
