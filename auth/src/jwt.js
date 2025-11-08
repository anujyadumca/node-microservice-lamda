import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

export const sign = (payload) => jwt.sign(payload, secret, { expiresIn: "1h" });
export const verify = (token) => jwt.verify(token, secret);
