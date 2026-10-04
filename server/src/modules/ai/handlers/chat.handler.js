import asyncHandler from "../../../middleware/asyncHandler.js";
import {
  streamChat,
  fallbackStreamChat,
  isConfigured,
} from "../services/ai.service.js";

// SSE orqali AI javobini real-time uzatadi. Har bir hodisa:
//   data: {"type":"token","value":"..."}      - matn bo'lagi
//   data: {"type":"tool","name":"...","args":{}} - sahna/aksiya buyrug'i
//   data: {"type":"done"}                      - tugadi
//   data: {"type":"error","message":"..."}     - xatolik
const chat = asyncHandler(async (req, res) => {
  const { history, context } = req.body;

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // nginx buferlashini o'chiradi
  });
  res.flushHeaders?.();

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  const controller = new AbortController();
  req.on("close", () => controller.abort());

  try {
    if (isConfigured()) {
      await streamChat(
        { history, context },
        { onEvent: send, signal: controller.signal },
      );
    } else {
      await fallbackStreamChat(
        { history, context },
        { onEvent: send, signal: controller.signal },
      );
    }
    send({ type: "done" });
  } catch (err) {
    if (!controller.signal.aborted) {
      send({
        type: "error",
        message: "Kechirasiz, javob berishda xatolik yuz berdi.",
      });
    }
  } finally {
    res.end();
  }
});

export default chat;
