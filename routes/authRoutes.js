const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Register User
// Register User (without explicit bcrypt.hash)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Create a new user without hashing the password here
    const newUser = new User({ name, email, password: password.trim() });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Trim password to remove any extra spaces
    const trimmedPassword = password.trim();

    // Log entered and stored password
    console.log("Entered password:", trimmedPassword);
    console.log("Stored password hash:", user.password);

    // Compare passwords
    const isUserMatch = await bcrypt.compare(trimmedPassword, user.password);

    console.log("Password match result:", isUserMatch);

    if (!isUserMatch) {
      console.log("Password does not match.");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password matched successfully!");

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
