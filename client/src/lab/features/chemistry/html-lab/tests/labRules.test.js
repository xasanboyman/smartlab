import { test } from "node:test";
import assert from "node:assert/strict";
import { detectReaction, detectHeatEvent, estimatePh, estimateVolume } from "../labRules.js";

const s = (id, extra = {}) => ({ id, kind: id.startsWith("el-") ? "element" : "compound", formula: id.replace(/^(el|cmp)-/, ""), state: "suyuq", ...extra });

test("potassium in water explodes with a balanced equation", () => {
  const r = detectReaction([s("cmp-h2o"), s("el-K", { formula: "K", state: "qattiq" })]);
  assert.equal(r.status, "portlash");
  assert.match(r.eq, /2K \+ 2H₂O/);
});

test("element rules still fire with their equation", () => {
  const r = detectReaction([s("el-H", { formula: "H" }), s("el-O", { formula: "O" })]);
  assert.equal(r.status, "portlash");
  assert.equal(r.eq, "2H₂ + O₂ → 2H₂O");
});

test("nothing reacts in plain water", () => {
  assert.equal(detectReaction([s("cmp-h2o")]), null);
});

test("pH follows the strongest acid or base", () => {
  assert.ok(estimatePh([s("cmp-h2so4")]) < 1);
  assert.ok(estimatePh([s("cmp-nh3")]) > 10);
  assert.equal(estimatePh([]), 7);
});

test("volume caps at the vessel size", () => {
  assert.equal(estimateVolume(Array.from({ length: 10 }, () => s("cmp-h2o"))), 250);
});

test("boiling needs water near 100 degrees", () => {
  assert.equal(detectHeatEvent({ poured: [s("cmp-h2o")], tempC: 80, heating: true }), null);
  assert.equal(detectHeatEvent({ poured: [s("cmp-h2o")], tempC: 100, heating: true }).status, "qaynash");
});
