import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};
