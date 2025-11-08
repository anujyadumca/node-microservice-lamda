const serverless = require('@vendia/serverless-express');
const express = require('express');
const cors = require('cors');
const { register, login } = require('./auth.service');
const { sign, verify } = require('./jwt');

const app = express();
app.use(express.json());
app.use(cors());

// Health check
app.get("/health", (req, res) => {
  console.log("Health check called");
  res.json({ 
    status: "healthy", 
    service: "auth-service",
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

// REGISTER
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Register attempt:", email);
    const user = await register(email, password);
    const token = await sign(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);
    const user = await login(email, password);
    const token = await sign(user);
    return res.json({ user, token });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// ME (Protected)
app.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const user = await verify(token);
    return res.json({ user });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// Export handler for Lambda
exports.handler = serverless({ app });