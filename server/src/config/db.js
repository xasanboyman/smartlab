import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

mongoose.set("strictQuery", true);

let connected = false;

export const isDbConnected = () => connected;

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URL, {
      serverSelectionTimeoutMS: 2000,
    });
    connected = true;
    logger.info("MongoDB ulandi");
  } catch (err) {
    connected = false;
    logger.warn(
      "⚠️ MongoDB topilmadi (offline). In-memory xotira rejimi faollashdi (Mock Store). Server to'liq ishlamoqda!",
    );
  }
};

export const disconnectDB = async () => {
  if (connected) {
    try {
      await mongoose.disconnect();
      connected = false;
      logger.info("MongoDB uzildi");
    } catch (err) {
      logger.warn({ err }, "MongoDB uzishda xatolik");
    }
  }
};
