const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const { authMiddleware } = require("../utils/jwt");

// Public get tasks
router.get("/", taskController.getTasks);

// Protected routes
router.post("/", authMiddleware, taskController.addTask);
router.put("/:id", authMiddleware, taskController.updateTask);
router.delete("/:id", authMiddleware, taskController.deleteTask);

module.exports = router;
