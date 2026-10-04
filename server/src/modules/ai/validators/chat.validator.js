import { z } from "zod";

const message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

// Joriy mavzudagi modellar ro'yxati - navigatsiya/tanlash uchun. formula/symbol
// ixtiyoriy: AI modelni aniqroq nomlashi uchun.
const item = z.object({
  id: z.string().max(120),
  name: z.string().max(200),
  formula: z.string().max(60).optional(),
  symbol: z.string().max(8).optional(),
});

// Tanlangan modelning to'liq ma'lumoti (formula, og'irlik, protonlar, masofa...).
// Frontend og'ir geometriyani (pos/atoms/bonds) oldindan tozalab yuboradi.
const scalar = z.union([z.string().max(800), z.number(), z.boolean()]);
const activeData = z
  .record(z.string().max(40), scalar)
  .refine((o) => Object.keys(o).length <= 40, "juda ko'p maydon");

// Kimyo laboratoriyasining jonli holati.
const labState = z.object({
  poured: z.array(z.string().max(80)).max(40).optional(),
  composition: z.record(z.string().max(8), z.number()).optional(),
  product: z.string().max(120).nullable().optional(),
  productFormula: z.string().max(60).nullable().optional(),
  heating: z.boolean().optional(),
  temperatureLabel: z.string().max(60).optional(),
  lastReaction: z.string().max(200).nullable().optional(),
});

// Mavjud reaktivlar/elementlar katalogi.
const catalogItem = z.object({
  name: z.string().max(120),
  formula: z.string().max(60).optional(),
});

export const chatSchema = z.object({
  body: z.object({
    history: z.array(message).max(30).default([]),
    context: z
      .object({
        subject: z.string().optional(),
        topic: z.string().optional(),
        title: z.string().optional(),
        activeItem: z.string().optional(),
        activeData: activeData.optional(),
        items: z.array(item).max(60).optional(),
        state: labState.optional(),
        catalog: z.array(catalogItem).max(60).optional(),
        recentActions: z.array(z.string().max(200)).max(20).optional(),
      })
      .optional(),
  }),
});
