const jwt = require("jsonwebtoken");
const { User } = require("../models");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    const validRoles = ["admin", "viewer"];
    const userRole = validRoles.includes(role) ? role : "viewer";

    // Check if email already exists (case insensitive)
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user with lowercase email and role
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password,
      role: userRole  // Save the role
    });
    
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    res.status(201).json({ 
      message: "User registered successfully", 
      user: userResponse 
    });
    
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      message: "Registration failed", 
      error: err.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );
    
    res.json({ 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      message: "Login failed", 
      error: err.message 
    });
  }
};