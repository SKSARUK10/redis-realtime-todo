const User = require("../models/User");
const { signToken } = require("../utils/jwt");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const user = await User.create({ username, email, password });
    const token = signToken({ id: user._id });
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername },
      ],
    });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = signToken({ id: user._id });
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
