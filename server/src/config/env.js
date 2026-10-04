import "dotenv/config";

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),

  MONGO_URL: process.env.MONGO_URL || "mongodb://127.0.0.1:27017/smartlab",

  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "smartlab_jwt_access_secret_key_2026_dev",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "smartlab_jwt_refresh_secret_key_2026_dev",
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || "15m",
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || "7d",

  COOKIE_SECRET:
    process.env.COOKIE_SECRET || "smartlab_cookie_secret_key_2026_dev",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});

export const isProd = env.NODE_ENV === "production";

export default env;
