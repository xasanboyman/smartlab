import { useState, Suspense } from "react";
import Scene from "@/lab/components/Scene";
import LabWorkspace from "@/lab/components/LabWorkspace";
import CellModel from "./CellModel";
import EukaryoticCellModel from "./EukaryoticCellModel";
import { ORGANELLES, CELL_MODELS, getOrganelle, getCellModel } from "@/lab/data/cell";
import { Sparkles, Box, RefreshCw } from "lucide-react";

const CellPage = () => {
  const [activeId, setActiveId] = useState("eukaryotic-cell");
  const [viewStyle, setViewStyle] = useState("realistic"); // "realistic" (Sketchfab GLB) or "schematic"
  const [autoRotate, setAutoRotate] = useState(true);

  const model = getCellModel(activeId);
  const organelle = getOrganelle(activeId);

  // Picker lists the full 3D model first, then all interactive organelles
  const items = [
    ...CELL_MODELS.map((m) => ({ id: m.id, name: m.name })),
    ...ORGANELLES,
  ];

  const currentTitle = model ? model.name : (organelle ? organelle.name : "Eukariot hujayra");
  const currentAbout = model ? model.about : (organelle ? organelle.about : "");

  return (
    <LabWorkspace
      title="Eukariot Hujayra 3D"
      description="Sketchfab 3D modeli asosidagi interaktiv eukariot hujayra va uning organoidlari. Organoid ustiga bosing yoki ro'yxatdan tanlang."
      backTo="/biology"
      backLabel="Biologiya"
      items={items}
      activeId={activeId}
      onSelect={setActiveId}
      scene={
        <Scene camera={[0, 1.8, 6.2]}>
          <Suspense fallback={null}>
            {viewStyle === "realistic" ? (
              <EukaryoticCellModel
                activeId={activeId}
                onSelect={(id) => setActiveId(id)}
                autoRotate={autoRotate}
              />
            ) : (
              <CellModel activeId={activeId} onSelect={setActiveId} />
            )}
          </Suspense>
        </Scene>
      }
      info={
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5">
              <button
                onClick={() => setViewStyle("realistic")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewStyle === "realistic"
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Batafsil 3D
              </button>
              <button
                onClick={() => setViewStyle("schematic")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewStyle === "schematic"
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Box className="h-3 w-3" />
                Sxematik
              </button>
            </div>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                autoRotate
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
              title="360° Avto-Aylantirish"
            >
              <RefreshCw className={`h-3 w-3 ${autoRotate ? "animate-spin text-emerald-400" : ""}`} />
              360°
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {organelle && (
                <span
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: organelle.color }}
                />
              )}
              <h2 className="text-xl font-bold tracking-tight text-white">{currentTitle}</h2>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{currentAbout}</p>
          </div>

          {organelle && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Organoid ma'lumotlari
              </div>
              <div className="text-xs text-zinc-400">
                Organoid ustiga bosish yoki chap tarafdagi ro'yxatdan tanlash orqali uning 3D shakli va joylashuvini yaqindan tekshirishingiz mumkin.
              </div>
            </div>
          )}

          {model && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                3D WebGL Eukaryotic Cell
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Sketchfab 3D modeli asosida optimallashgan (Draco WebGL) eukariot hujayra. Modelni erkin aylantirish (sichqoncha / sensor), yaqinlashtirish va har bir organoidni alohida belgilash mumkin.
              </p>
            </div>
          )}
        </div>
      }
    />
  );
};

export default CellPage;
