import asyncHandler from "../../../middleware/asyncHandler.js";
import { analyzeReaction } from "../services/reaction.service.js";

// Ikki moddani (miqdori bilan) tahlil qiladi va reaksiya status'ini qaytaradi (AI yoki lokal qoidalar).
const reaction = asyncHandler(async (req, res) => {
  const { a, b } = req.body;
  const result = await analyzeReaction({ a, b });
  res.json({ success: true, data: result });
});

export default reaction;
