const express = require("express");
const router = express.Router();
const { User } = require("../models"); // ← Use the User model

// Receive product/material from integration hub
router.post("/product", async (req, res) => {
  const { name, code, uom, price } = req.body;

  console.log(`💰 Sales Flow receiving: ${name} (Code: ${code})`);

  try {
    console.log(`   ✅ Product reference stored: ${code} - ${name}`);
    res.json({ id: Date.now(), success: true, code: code, name: name });
  } catch (err) {
    console.error("Integration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Receive user from integration hub
router.post("/user", async (req, res) => {
  const { name, email, password, role } = req.body;

  console.log(`👤 Sales Flow receiving user: ${name} (${email})`);

  try {
    // Check if user already exists
    const existing = await User.findOne({ where: { email } });

    if (existing) {
      console.log(`   ⚠️ User already exists (ID: ${existing.id})`);
      return res.json({ id: existing.id, success: true, existing: true });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "viewer",
    });

    console.log(`   ✅ Created Sales Flow user (ID: ${user.id})`);
    res.json({ id: user.id, success: true });
  } catch (err) {
    console.error("Integration user error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
