/**
 * Comprehensive Chemistry Simulation Engine
 * Handles stoichiometry, energetic runaway reactions, pH, precipitates,
 * thermodynamics, and visual/audio event triggering.
 */

export class ChemicalSimEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.reagents = new Set();
    this.volume = 80; // ml
    this.temperature = 22.0; // °C
    this.targetTemp = 22.0;
    this.pH = 7.0;
    this.colorHex = 0x2288ff; // Initial aqueous blue
    this.isBoiling = false;
    this.precipitate = null;
    this.activeEvent = null; // { type: 'explosion'|'geyser'|'hypergolic'|'foam', duration, ... }
    this.eventTimer = 0;
    this.reactionName = "Xona haroratidagi suvli eritma";
    this.equation = "H₂O (l)";
  }

  addReagent(reagentId) {
    this.reagents.add(reagentId);
    this.volume = Math.min(240, this.volume + 30);
    this.evaluateReactions(reagentId);
  }

  heat(dt, burnerLit, collarOpen) {
    if (burnerLit) {
      const heatRate = collarOpen ? 45 : 22; // Roaring blue flame heats faster
      this.targetTemp = Math.min(280, this.temperature + heatRate * dt);
    } else {
      // Cool down towards ambient (22°C)
      this.targetTemp = Math.max(22, this.temperature - 12 * dt);
    }

    this.temperature += (this.targetTemp - this.temperature) * (dt * 2.5);
    this.isBoiling = this.temperature >= 100 && this.volume > 0;
  }

  evaluateReactions(trigger) {
    const r = this.reagents;

    // 1. Violent: Sodium in Water
    if (r.has("Na") && (r.has("H2O") || this.volume > 0)) {
      this.activeEvent = {
        type: "explosion",
        name: "Natriyning suv bilan portlashi",
        equation: "2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂↑ + 💥 Issiqlik",
        duration: 3.5,
      };
      this.eventTimer = 3.5;
      this.pH = 13.8;
      this.temperature = 185;
      this.colorHex = 0xffe066;
      this.reactionName = "Natriyning shiddatli reaksiyasi";
      this.equation = "2Na + 2H₂O → 2NaOH + H₂↑";
      return;
    }

    // 2. Violent: KMnO4 + Glycerin Hypergolic Combustion
    if (r.has("KMnO4") && r.has("Glycerin")) {
      this.activeEvent = {
        type: "hypergolic",
        name: "KMnO₄ + Glitserin Gipergolik Olovi",
        equation: "14KMnO₄ + 4C₃H₅(OH)₃ → 7K₂CO₃ + 7Mn₂O₃ + 5CO₂↑ + 16H₂O",
        duration: 5.0,
      };
      this.eventTimer = 5.0;
      this.temperature = 320;
      this.colorHex = 0x9900ff;
      this.reactionName = "Gipergolik purpur alangasi";
      this.equation = "14KMnO₄ + 4Glitserin → 7K₂CO₃ + 7Mn₂O₃ + Olov";
      return;
    }

    // 3. Catalytic Runaway: 30% H2O2 + MnO2 Oxygen Geyser
    if (r.has("H2O2") && r.has("MnO2")) {
      this.activeEvent = {
        type: "geyser",
        name: "Vodorod peroksidining katalitik qaynab otilishi",
        equation: "2H₂O₂(aq) —[MnO₂]→ 2H₂O(l) + O₂↑ + Bug'",
        duration: 4.5,
      };
      this.eventTimer = 4.5;
      this.temperature = 108;
      this.colorHex = 0x332211;
      this.reactionName = "O₂ kislorodli geyzer otilishi";
      this.equation = "2H₂O₂ —[MnO₂]→ 2H₂O + O₂↑";
      return;
    }

    // 4. Acid + Carbonate Effervescence
    if (r.has("HCl") && r.has("NaHCO3")) {
      this.activeEvent = {
        type: "foam",
        name: "Kislota-karbonat ko'piklanishi",
        equation: "HCl(aq) + NaHCO₃(s) → NaCl(aq) + H₂O(l) + CO₂↑",
        duration: 3.0,
      };
      this.eventTimer = 3.0;
      this.pH = 6.8;
      this.colorHex = 0xddffff;
      this.reactionName = "CO₂ ko'piklanib ajralishi";
      this.equation = "HCl + NaHCO₃ → NaCl + H₂O + CO₂↑";
      return;
    }

    // 5. Precipitation: CuSO4 + NaOH -> Cu(OH)2 Blue Precipitate
    if (r.has("CuSO4") && r.has("NaOH")) {
      this.precipitate = "Cu(OH)₂ (Moviy cho'kma)";
      this.colorHex = 0x0066cc;
      this.pH = 11.5;
      this.reactionName = "Mis(II) gidroksid cho'kmasi";
      this.equation = "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄";
      return;
    }

    // 6. Precipitation: AgNO3 + NaCl -> AgCl White Curdy Precipitate
    if (r.has("AgNO3") && r.has("NaCl")) {
      this.precipitate = "AgCl (Oq tvorogsimon cho'kma)";
      this.colorHex = 0xf0f0f8;
      this.pH = 7.0;
      this.reactionName = "Kumush xlorid cho'kmasi hosil bo'lishi";
      this.equation = "AgNO₃ + NaCl → AgCl↓ + NaNO₃";
      return;
    }

    // 7. Acid-Base Neutralization with Phenolphthalein Indicator
    if (r.has("Phenolphthalein")) {
      if (r.has("NaOH") || r.has("KOH")) {
        // Basic: Brilliant Magenta Pink
        this.colorHex = 0xff007f;
        this.pH = 12.0;
        this.reactionName = "Ishqoriy muhit (Fenolftalein to'q qizil)";
      } else if (r.has("HCl") || r.has("H2SO4")) {
        // Acidic: Clear Colorless
        this.colorHex = 0xbbddff;
        this.pH = 1.8;
        this.reactionName = "Kislotali muhit (Fenolftalein rangsiz)";
      }
      return;
    }

    // Default solution color assignment
    if (r.has("CuSO4")) {
      this.colorHex = 0x0088ff;
      this.pH = 4.8;
      this.reactionName = "Mis kuporosi eritmasi";
    } else if (r.has("KMnO4")) {
      this.colorHex = 0x8800bb;
      this.pH = 7.0;
      this.reactionName = "Kaliy permanganat to'q binafsha eritmasi";
    } else if (r.has("HCl")) {
      this.colorHex = 0xccddee;
      this.pH = 1.0;
      this.reactionName = "Xlorid kislota eritmasi";
    } else if (r.has("NaOH")) {
      this.colorHex = 0xeeeeff;
      this.pH = 13.5;
      this.reactionName = "Natriy gidroksid ishqoriy eritmasi";
    }
  }

  update(dt) {
    if (this.activeEvent) {
      this.eventTimer -= dt;
      if (this.eventTimer <= 0) {
        this.activeEvent = null;
      }
    }
  }
}
