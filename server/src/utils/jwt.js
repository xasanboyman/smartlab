import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const signAccess = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });

export const signRefresh = (payload) =>
  jwt.sign(
    { jti: payload?.jti || crypto.randomUUID(), ...payload },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL },
  );

export const verifyAccess = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export const verifyRefresh = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
