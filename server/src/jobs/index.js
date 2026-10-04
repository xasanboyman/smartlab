import logger from "../config/logger.js";
import { isDbConnected } from "../config/db.js";
import mockStore from "../services/mockStore.js";

let mockIntervalId = null;

export const startJobs = async () => {
  if (!isDbConnected()) {
    logger.info(
      "MongoDB ulanmagan: Agenda o'tkazib yuborildi, in-memory tozalash rejimi faol.",
    );
    mockIntervalId = setInterval(() => {
      mockStore.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
    return;
  }

  try {
    const { default: agenda } = await import("../config/agenda.js");
    const { default: defineCleanupExpiredTokens, JOB_NAME: CLEANUP_JOB } =
      await import("./cleanupExpiredTokens.job.js");

    defineCleanupExpiredTokens(agenda);
    await agenda.start();
    await agenda.every("0 3 * * *", CLEANUP_JOB);
    logger.info("Agenda ishga tushirildi");
  } catch (err) {
    logger.warn({ err }, "Agenda ishga tushirishda xatolik, o'tkazib yuborildi");
  }
};

export const stopJobs = async () => {
  if (mockIntervalId) {
    clearInterval(mockIntervalId);
    mockIntervalId = null;
  }

  if (isDbConnected()) {
    try {
      const { default: agenda } = await import("../config/agenda.js");
      await agenda.stop();
      logger.info("Agenda to'xtatildi");
    } catch {
      // ignore
    }
  }
};
