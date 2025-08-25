require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Morgan: log method, url and response status
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

// Health check
app.get("/", (req, res) => res.json({ status: "ok" }));

// API routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

module.exports = app;
