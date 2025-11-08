const express = require("express");
const cors = require("cors");
const serverless = require("@vendia/serverless-express");
const jwt = require("jsonwebtoken");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const { register, login } = require("./auth.service");

// ----- load JWT_SECRET from SSM once (cold start) -----
let JWT_SECRET = process.env.JWT_SECRET || null;
async function loadSecret() {
  if (JWT_SECRET) return JWT_SECRET;
  const path = process.env.JWT_SECRET_PARAM_PATH; // e.g. /auth-basic/dev/JWT_SECRET
  if (!path) throw new Error("Missing JWT_SECRET or JWT_SECRET_PARAM_PATH");

  const ssm = new SSMClient({});
  const { Parameter } = await ssm.send(new GetParameterCommand({
    Name: path,
    WithDecryption: true
  }));
  JWT_SECRET = Parameter.Value;
  return JWT_SECRET;
}

// ----- express app -----
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "auth" }));

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 6) return res.status(422).json({ message: "Invalid payload" });

    const user = await register(email, password);
    const secret = await loadSecret();
    const token = jwt.sign(user, secret, { expiresIn: "1h" });
    return res.status(201).json({ user, token });
  } catch (e) {
    const code = /exists/i.test(e.message) ? 409 : 400;
    return res.status(code).json({ message: e.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(422).json({ message: "Invalid payload" });

    const user = await login(email, password);
    const secret = await loadSecret();
    const token = jwt.sign(user, secret, { expiresIn: "1h" });
    return res.json({ user, token });
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }
});

app.get("/auth/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });
    const secret = await loadSecret();
    const user = jwt.verify(token, secret);
    return res.json({ user });
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// Lambda handler (CommonJS export)
module.exports.handler = serverless({ app });
