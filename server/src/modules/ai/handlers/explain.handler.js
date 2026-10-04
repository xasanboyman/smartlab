import asyncHandler from "../../../middleware/asyncHandler.js";
import { explainPart } from "../services/explain.service.js";

// 3D modeldagi tanlangan qismni tushuntiradi (AI yoki lokal qoidalar).
const explain = asyncHandler(async (req, res) => {
  const data = await explainPart(req.body);
  res.json({ success: true, data });
});

export default explain;
