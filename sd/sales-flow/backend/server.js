const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb, sequelize } = require("./config/db");

dotenv.config();
const app = express();

// Load models first
require("./models");

// Async startup function
const startServer = async () => {
  try {
    // Connect to database
    await connectDb();
    console.log("Database connected successfully");

    // Sync models WITHOUT altering existing tables
    // Only creates tables if they don't exist
    await sequelize.sync({ alter: false });
    console.log("Models synchronized");

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.use("/api/auth", require("./routes/auth"));
    app.use("/api/orders", require("./routes/orders"));
    app.use("/api/delivery", require("./routes/delivery"));
    app.use("/api/invoices", require("./routes/invoices"));
    app.use("/api/reports", require("./routes/reports"));

    // Integration route
    app.use("/api/integration", require("./routes/integration"));

    // Start server
    const PORT = process.env.PORT || 5007;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
