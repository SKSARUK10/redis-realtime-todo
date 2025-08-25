const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes for faster queries
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ user: 1 });

module.exports = mongoose.model("Task", TaskSchema);
