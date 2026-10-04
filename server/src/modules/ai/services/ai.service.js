import OpenAI from "openai";
import env from "../../../config/env.js";
import { SYSTEM_PROMPT, LAB_KNOWLEDGE } from "../ai.knowledge.js";
import { AI_TOOLS } from "../ai.tools.js";

let client = null;
const getClient = () => {
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
};

export const isConfigured = () => Boolean(env.OPENAI_API_KEY);

// activeData kalitlari uchun o'zbekcha yorliqlar (qolganlari xom kalit nomida).
const FIELD_LABELS = {
  formula: "Formula",
  weight: "Molyar massa",
  category: "Kategoriya",
  categoryLabel: "Kategoriya",
  state: "Holat",
  nameEn: "Inglizcha nomi",
  iupacName: "IUPAC nomi",
  symbol: "Belgi",
  number: "Tartib raqami",
  protons: "Protonlar soni",
  neutrons: "Neytronlar soni",
  shells: "Elektron qobiqlar",
  about: "Tavsif",
  distance: "Quyoshdan masofa (shartli)",
  speed: "Aylanish tezligi (shartli)",
  size: "Nisbiy o'lcham",
  amplitude: "Amplituda",
  frequency: "Chastota",
  type: "Turi",
};

const renderActiveData = (data) =>
  Object.entries(data).map(
    ([k, v]) => `  • ${FIELD_LABELS[k] || k}: ${v}`,
  );

const renderLabState = (st) => {
  const out = [];
  if (Array.isArray(st.poured) && st.poured.length)
    out.push(`Idishga quyilgan: ${st.poured.join(", ")}`);
  else out.push("Idish hozir bo'sh");
  if (st.composition) {
    const comp = Object.entries(st.composition)
      .filter(([, n]) => n > 0)
      .map(([el, n]) => `${el}×${n}`)
      .join(", ");
    if (comp) out.push(`Tarkib (atomlar): ${comp}`);
  }
  if (st.product)
    out.push(
      `Aralashmadan aniqlangan modda: ${st.product}${st.productFormula ? ` (${st.productFormula})` : ""}`,
    );
  if (st.lastReaction) out.push(`Oxirgi reaksiya: ${st.lastReaction}`);
  if (st.temperatureLabel) out.push(`Harorat: ${st.temperatureLabel}`);
  else if (typeof st.heating === "boolean")
    out.push(`Isitish: ${st.heating ? "yoqilgan" : "o'chiq"}`);
  return out;
};

const buildContextMessage = (ctx = {}) => {
  if (!ctx || Object.keys(ctx).length === 0) return null;
  const lines = [];
  if (ctx.subject) lines.push(`Fan: ${ctx.subject}`);
  if (ctx.topic) lines.push(`Mavzu: ${ctx.topic}`);
  if (ctx.title) lines.push(`Sahifa: ${ctx.title}`);
  if (ctx.activeItem) lines.push(`Hozir tanlangan model: ${ctx.activeItem}`);

  if (ctx.activeData && Object.keys(ctx.activeData).length) {
    lines.push("Tanlangan model haqida real ma'lumotlar (shularga asoslan):");
    lines.push(...renderActiveData(ctx.activeData));
  }

  if (Array.isArray(ctx.items) && ctx.items.length) {
    const list = ctx.items
      .slice(0, 40)
      .map((it) => (it.formula ? `${it.name} (${it.formula})` : it.name))
      .join(", ");
    lines.push(`Joriy mavzudagi mavjud modellar: ${list}`);
  }

  if (ctx.state && Object.keys(ctx.state).length) {
    const stLines = renderLabState(ctx.state);
    if (stLines.length)
      lines.push(
        `[LABORATORIYA HOLATI]\n${stLines.map((s) => `  • ${s}`).join("\n")}`,
      );
  }

  if (Array.isArray(ctx.catalog) && ctx.catalog.length) {
    const list = ctx.catalog
      .slice(0, 40)
      .map((c) => (c.formula ? `${c.name} (${c.formula})` : c.name))
      .join(", ");
    lines.push(`Mavjud reaktiv va elementlar: ${list}`);
  }

  if (Array.isArray(ctx.recentActions) && ctx.recentActions.length) {
    lines.push(`Foydalanuvchining oxirgi amallari: ${ctx.recentActions.join("; ")}`);
  }
  if (!lines.length) return null;
  return `[KONTEKST - foydalanuvchi ayni damda nimani ko'rib turibdi]\n${lines.join("\n")}`;
};

const buildMessages = (history = [], context = {}) => {
  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${LAB_KNOWLEDGE}` },
  ];
  const ctxMsg = buildContextMessage(context);
  if (ctxMsg) messages.push({ role: "system", content: ctxMsg });

  for (const m of history) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: String(m.content || "") });
    }
  }
  return messages;
};

export const streamChat = async ({ history, context }, { onEvent, signal }) => {
  const openai = getClient();
  const messages = buildMessages(history, context);

  const stream = await openai.chat.completions.create(
    {
      model: env.OPENAI_MODEL,
      messages,
      tools: AI_TOOLS,
      tool_choice: "auto",
      stream: true,
      temperature: 0.7,
      max_tokens: 700,
    },
    { signal },
  );

  const toolCalls = new Map();

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta;
    if (!delta) continue;

    if (delta.content) onEvent({ type: "token", value: delta.content });

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;
        const acc = toolCalls.get(idx) || { name: "", args: "" };
        if (tc.function?.name) acc.name = tc.function.name;
        if (tc.function?.arguments) acc.args += tc.function.arguments;
        toolCalls.set(idx, acc);
      }
    }
  }

  for (const { name, args } of toolCalls.values()) {
    if (!name) continue;
    let parsed = {};
    try {
      parsed = args ? JSON.parse(args) : {};
    } catch {
      continue;
    }
    onEvent({ type: "tool", name, args: parsed });
  }
};

// ============================================================================
// Intelligent Domain Fallback Stream (When OPENAI_API_KEY is not configured)
// ============================================================================
export const fallbackStreamChat = async (
  { history = [], context = {} },
  { onEvent, signal },
) => {
  const lastUserMsg =
    [...history].reverse().find((m) => m.role === "user")?.content || "";
  const query = String(lastUserMsg).toLowerCase().trim();

  const subject = context?.subject || "chemistry";
  const topic = context?.topic || "molecules";
  const activeItem = context?.activeItem || "";
  const activeData = context?.activeData || {};

  let textResponse = "";
  let toolCalls = [];

  // 1. Scene control check
  if (query.includes("yaqinlashtir") || query.includes("kattalashtir") || query.includes("zoom in")) {
    textResponse = "3D modelni siz uchun yaqinlashtirmoqdaman! 🔍 Endi qismlarni batafsil ko'rishingiz mumkin.";
    toolCalls.push({ name: "control_scene", args: { action: "zoom_in" } });
  } else if (query.includes("uzoqlashtir") || query.includes("kichiklashtir") || query.includes("zoom out")) {
    textResponse = "3D sahnani uzoqlashtirdim! 🔎 Umumiy ko'rinishga qaytdik.";
    toolCalls.push({ name: "control_scene", args: { action: "zoom_out" } });
  } else if (query.includes("to'xtat") || query.includes("toxtat") || query.includes("pauza") || query.includes("stop")) {
    textResponse = "3D animatsiyani to'xtatdim (pauza). ⏸️ Istagan vaqtda qayta ishga tushirishingiz mumkin.";
    toolCalls.push({ name: "control_scene", args: { action: "pause" } });
  } else if (query.includes("davom") || query.includes("aylantir") || query.includes("boshla") || query.includes("play")) {
    textResponse = "Harakat va aylanishni davom ettirmoqdaman! ▶️";
    toolCalls.push({ name: "control_scene", args: { action: "resume" } });
  } else if (query.includes("tikla") || query.includes("boshlang'ich") || query.includes("qaytar") || query.includes("reset")) {
    textResponse = "Kamera va sahnani boshlang'ich koordinatalariga tikladim! 🔄";
    toolCalls.push({ name: "control_scene", args: { action: "reset" } });
  }

  // 2. Quiz generation check
  else if (
    query.includes("test") ||
    query.includes("kviz") ||
    query.includes("savol") ||
    query.includes("sina") ||
    query.includes("quiz")
  ) {
    if (subject === "biology") {
      textResponse = "Ajoyib! Keling, biologiya bo'yicha bilimingizni sinab ko'ramiz. Quyidagi savolga javob bering: 🧬";
      toolCalls.push({
        name: "start_quiz",
        args: {
          question: "Hujayrada oqsil sintezini qaysi organoid amalga oshiradi?",
          options: ["Mitoxondriya", "Ribosoma", "Vakuola", "Lizosoma"],
          correctIndex: 1,
        },
      });
    } else if (subject === "physics") {
      textResponse = "Tayyormisiz? Ichki yonuv dvigateli bo'yicha qiziqarli test savoli: ⚙️";
      toolCalls.push({
        name: "start_quiz",
        args: {
          question: "4 taktli dvigatelda uchinchi takt qanday ataladi?",
          options: ["So'rish takti", "Siqish takti", "Ish yo'li (kengayish)", "Chiqarish takti"],
          correctIndex: 2,
        },
      });
    } else {
      textResponse = "Keling, kimyo bo'yicha bilimingizni tekshirib ko'ramiz! 🧪";
      toolCalls.push({
        name: "start_quiz",
        args: {
          question: "Suv (H₂O) molekulasidagi vodorod va kislorod atomlarining bog'lanish burchagi taxminan necha gradus?",
          options: ["90°", "104.5°", "120°", "180°"],
          correctIndex: 1,
        },
      });
    }
  }

  // 3. Navigation check
  else if (query.includes("dnk") || query.includes("dna")) {
    textResponse = "Sizni DNK qo'sh spirali mavzusiga yo'naltirmoqdaman! 🧬";
    toolCalls.push({ name: "navigate_topic", args: { subject: "biology", topic: "dna" } });
  } else if (query.includes("hujayra") || query.includes("organoid")) {
    textResponse = "Hujayra tuzilishi mavzusiga o'tamiz! 🧫";
    toolCalls.push({ name: "navigate_topic", args: { subject: "biology", topic: "cell" } });
  } else if (query.includes("dvigatel") || query.includes("motor")) {
    textResponse = "4 taktli ichki yonuv dvigateli 3D simulyatsiyasiga o'tmoqdamiz! 🚗";
    toolCalls.push({ name: "navigate_topic", args: { subject: "physics", topic: "engine" } });
  } else if (query.includes("davriy") || query.includes("element")) {
    textResponse = "Mendeleyev davriy jadvaliga o'tamiz! 🧪";
    toolCalls.push({ name: "navigate_topic", args: { subject: "chemistry", topic: "periodic-table" } });
  }

  // 4. Content / domain explanation
  else {
    const greetings = ["salom", "assalomu", "qalesan", "mira", "qandaysan"];
    const isGreeting = greetings.some((g) => query.includes(g));

    if (isGreeting && !activeItem && Object.keys(activeData).length === 0) {
      textResponse =
        "Assalomu alaykum! Men Mira — SmartLab laboratoriyasining sun'iy intellekt yordamchisiman. 😊 " +
        "Kimyo, biologiya va fizika 3D modellarini birgalikda o'rganamiz. Sahnani kattalashtirish, " +
        "harakatni to'xtatish yoki biror model haqida ma'lumot olish uchun menga buyruq bering!";
    } else if (Object.keys(activeData).length > 0 || activeItem) {
      const titleName = activeData.name || activeItem || context.title || "Joriy model";
      const formulaStr = activeData.formula ? ` (formulasi: ${activeData.formula})` : "";
      const weightStr = activeData.weight ? ` Molyar massasi: ${activeData.weight}.` : "";
      const desc = activeData.about || activeData.description || "";

      textResponse =
        `Ayni damda ekranda ko'rib turgan modelingiz: **${titleName}**${formulaStr}. ✨\n\n` +
        (desc ? `${desc}\n\n` : "") +
        (weightStr ? `${weightStr} ` : "") +
        "Ushbu modelni sichqoncha yordamida barcha tomondan aylantirib, atom va tuzilmalarini yaqindan tekshirishingiz mumkin. " +
        "Agar xohlasangiz, men uni siz uchun yaqinlashtirib berishim yoki test savoli berishim mumkin!";
    } else {
      if (subject === "chemistry") {
        textResponse =
          "Kimyo faniga xush kelibsiz! 🧪 Bu yerda siz molekulalarning fazoviy tuzilishi, " +
          "atom elektron qobiqlari hamda laboratoriya idishlarida moddalar reaksiyasini " +
          "xavfsiz 3D muhitda tajriba qilib ko'rishingiz mumkin. Biror savolingiz bormi?";
      } else if (subject === "biology") {
        textResponse =
          "Biologiya olamiga xush kelibsiz! 🧫 Hujayra organoidlari, DNK qo'sh spirali, " +
          "inson skeleti, mushaklari va ichki a'zolarini 3D formatda o'rganishingiz mumkin. " +
          "Qaysi a'zo yoki tizim sizni qiziqtiradi?";
      } else if (subject === "physics") {
        textResponse =
          "Fizika laboratoriyasiga xush kelibsiz! 🔭 Bu yerda 4 taktli dvigatelning real ishlash sikli, " +
          "to'lqinlar interferensiyasi va Quyosh tizimi sayyoralarining harakatini jonli kuzatishingiz mumkin. ⚙️";
      } else {
        textResponse =
          "SmartLab 3D virtual laboratoriyasida sizga yordam berishdan mamnunman! " +
          "3D sahnadagi har qanday modelni tanlang yoki savol bering. ✨";
      }
    }
  }

  // Stream text response word by word
  const words = textResponse.split(/(\s+)/);
  for (const word of words) {
    if (signal?.aborted) return;
    onEvent({ type: "token", value: word });
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  // Stream tool calls if any
  for (const tc of toolCalls) {
    if (signal?.aborted) return;
    onEvent({ type: "tool", name: tc.name, args: tc.args });
  }
};
