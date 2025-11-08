import express from "express";
import serverless from "@vendia/serverless-express";
import cors from "cors";
import { register, login } from "./auth.service.js";
import { verify } from "./jwt.js";

const app = express();
app.use(express.json());
app.use(cors());

// REGISTER
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await register(email, password);
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await login(email, password);
    const token = verify.sign(user);
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
    const user = verify.verify(token);
    return res.json({ user });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// Export handler for Lambda
export const handler = serverless({ app });
