import express from "express";
import serverless from "@vendia/serverless-express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Health check - SIMPLE VERSION FIRST
app.get("/health", (req, res) => {
  console.log("Health check called");
  res.json({ 
    status: "healthy", 
    service: "auth-service",
    timestamp: new Date().toISOString()
  });
});

// Test route - SIMPLE VERSION FIRST
app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

// SIMPLE REGISTER (without auth.service.js dependencies first)
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Register attempt:", email);
    
    // Simple response without database
    const user = {
      email,
      createdAt: new Date().toISOString(),
      message: "User registered (mock)"
    };
    
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// SIMPLE LOGIN (without auth.service.js dependencies first)
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);
    
    // Simple response without JWT
    const user = {
      email,
      message: "User logged in (mock)"
    };
    
    const token = "mock-jwt-token-for-testing";
    
    return res.json({ user, token });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Export handler for Lambda
export const handler = serverless({ app });
