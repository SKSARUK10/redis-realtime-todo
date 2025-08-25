const Task = require("../models/Task");
const { getCache, setCache, delCache } = require("../utils/cache"); // make sure delCache is imported
const redis = require("../config/redis");

const TASKS_CACHE_KEY = "tasks:all";

// --- Optimized SCAN ---
async function scanKeys(pattern) {
  let cursor = "0";
  const keys = [];
  do {
    const { cursor: nextCursor, keys: batch } = await redis.scan(cursor, {
      MATCH: pattern,
      COUNT: 500, // ↑ bigger batch size for fewer round-trips
    });
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

// -------------------- CONTROLLERS --------------------

// ✅ Get all tasks (with multi-layer caching: memory -> redis -> db)
exports.getTasks = async (req, res) => {
  try {
    // 1. Check short-term cache (fastest)
    const cached = await getCache(TASKS_CACHE_KEY);
    if (cached) {
      return res.json({ source: "cache", data: cached });
    }

    // 2. Check Redis hashes
    let tasks = [];
    const keys = await scanKeys("task:*");

    if (keys.length > 0) {
      const pipeline = redis.multi();
      keys.forEach((key) => pipeline.hGetAll(key));
      const redisData = await pipeline.exec();

      tasks = redisData
        .map((task, i) => {
          if (!task || !task.text) return null; // ignore empty hashes
          return {
            _id: keys[i].split(":")[1],
            text: task.text,
            completed: task.completed === "true",
            user: task.user,
            createdAt: new Date(task.createdAt),
          };
        })
        .filter(Boolean);
    }

    // 3. Fallback to DB if Redis empty
    if (tasks.length === 0) {
      tasks = await Task.find().sort({ createdAt: -1 }).lean();
    }

    // 4. Update Redis & cache asynchronously (non-blocking response)
    if (tasks.length > 0) {
      setCache(TASKS_CACHE_KEY, tasks, 120).catch(console.error); // in-memory cache

      const pipeline = redis.multi();
      tasks.forEach((task) => {
        pipeline.hSet(`task:${task._id}`, {
          text: task.text,
          completed: task.completed.toString(),
          user: task.user?.toString() || "",
          createdAt: task.createdAt.toISOString(),
        });
        pipeline.expire(`task:${task._id}`, 3600); // 1h TTL
      });
      pipeline.exec().catch(console.error);
    }

    const source = keys.length > 0 ? "redis-hash" : "db";
    res.json({ source, data: tasks });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    const cached = await getCache(TASKS_CACHE_KEY);
    if (cached) {
      return res.json({ source: "cache-fallback", data: cached });
    }
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add a task
exports.addTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: "Task text required" });
    }

    // Save in Mongo
    const newTask = await Task.create({
      text: text.trim(),
      user: req.user ? req.user._id : undefined,
    });

    // Save in Redis
    await redis
      .multi()
      .hSet(`task:${newTask._id}`, {
        text: newTask.text,
        completed: newTask.completed.toString(),
        user: newTask.user?.toString() || "",
        createdAt: newTask.createdAt.toISOString(),
      })
      .expire(`task:${newTask._id}`, 3600)
      .exec();

    // Invalidate tasks list cache (let it rebuild on next request)
    delCache(TASKS_CACHE_KEY).catch(console.error);

    // Publish event (real-time)
    await redis.publish(
      "tasks",
      JSON.stringify({ action: "added", task: newTask })
    );

    res.status(201).json(newTask);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      lean: true,
    });
    if (!updated) return res.status(404).json({ error: "Task not found" });

    // Update Redis hash
    await redis
      .multi()
      .hSet(`task:${updated._id}`, {
        text: updated.text,
        completed: updated.completed.toString(),
        user: updated.user?.toString() || "",
        createdAt: updated.createdAt.toISOString(),
      })
      .expire(`task:${updated._id}`, 3600)
      .exec();

    // Invalidate tasks list cache
    delCache(TASKS_CACHE_KEY).catch(console.error);

    // Publish event
    await redis.publish(
      "tasks",
      JSON.stringify({ action: "updated", task: updated })
    );

    res.json(updated);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: "Task not found" });

    // Remove from Redis
    await redis.del(`task:${id}`);

    // Invalidate tasks list cache
    delCache(TASKS_CACHE_KEY).catch(console.error);

    // Publish event
    await redis.publish(
      "tasks",
      JSON.stringify({ action: "deleted", task: deleted })
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: err.message });
  }
};
