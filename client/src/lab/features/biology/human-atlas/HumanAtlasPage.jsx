// "Inson atlasi" - BodyParts3D asosidagi 2234 qismli interaktiv anatomiya.
// Tizimlarni yoqib-o'chirish, qidiruv, portlatish (inventar) va ajratib
// ko'rsatish. Butun UI holati bitta useObjectState'da.
import { useCallback, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import useObjectState from "@/shared/hooks/useObjectState";
import Scene from "@/lab/components/Scene";
import LabWorkspace from "@/lab/components/LabWorkspace";
import { useAtlasQuery } from "./hooks/useAtlasQuery";
import AtlasBody from "./AtlasBody";
import AtlasControls from "./AtlasControls";
import AtlasDetailCard from "./AtlasDetailCard";
import { SYSTEMS, SYSTEM_BY_ID, DEFAULT_VISIBLE, PRESETS, translateName } from "./data/systems";
import BioStudio from "../shared/BioStudio";
import { BIO_GL, BIO_SCENE_BG, BIO_WORKSPACE } from "../shared/bioTheme";
import { BioLoading } from "../shared/BioUi";

const INITIAL = {
  preset: "all",
  visible: DEFAULT_VISIBLE,
  selected: [],
  chosen: null,
  isolate: false,
  explode: 0,
  query: "",
  progress: 0,
  error: "",
};

const HumanAtlasPage = () => {
  const { data: atlas, isError: manifestFailed, isLoading: manifestLoading } = useAtlasQuery();
  const state = useObjectState(INITIAL);
  const { preset, visible, selected, chosen, isolate, explode, query, progress, error, setField, setFields } = state;

  const partsById = useMemo(() => new Map(atlas?.parts.map((p) => [p.id, p])), [atlas]);
  const counts = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0])),
    [atlas],
  );
  const selectedParts = useMemo(() => selected.map((id) => partsById.get(id)).filter(Boolean), [selected, partsById]);
  const visibleCount = useMemo(
    () => atlas?.parts.filter((p) => (isolate ? selected.includes(p.id) : visible.includes(p.system) || selected.includes(p.id))).length ?? 0,
    [atlas, isolate, selected, visible],
  );

  // Tushunchani (bir yoki bir nechta qism) tanlash.
  const choose = useCallback(
    (concept) => setFields({ chosen: concept, selected: concept.elements, isolate: false }),
    [setFields],
  );
  // 3D sahnada bosilgan yagona qism.
  const pickPart = useCallback(
    (id) => {
      const p = partsById.get(id);
      if (!p) return;
      setFields({ chosen: { id: p.conceptId, name: p.name, elements: [id] }, selected: [id], isolate: false });
    },
    [partsById, setFields],
  );
  const clearSelection = () => setFields({ chosen: null, selected: [], isolate: false });

  // Preset pill'lari (AI select_item ham shu orqali keladi).
  const applyPreset = useCallback(
    (id) => {
      const p = PRESETS.find((x) => x.id === id);
      if (!p) return;
      setFields({ preset: id, visible: p.systems, selected: [], chosen: null, isolate: false });
    },
    [setFields],
  );
  const setVisible = (list) => setFields({ preset: null, visible: list, selected: [], chosen: null, isolate: false });
  const toggleSystem = (id) => setVisible(visible.includes(id) ? visible.filter((x) => x !== id) : [...visible, id]);
  const resetAll = () => setFields({ ...INITIAL, progress, error });

  // AI kontekst: tanlangan tuzilma va ko'rinayotgan tizimlar haqida real ma'lumot.
  const aiContext = useMemo(
    () => ({
      source: "BodyParts3D 4.0 (CC BY 4.0), katta yoshli erkak etalon anatomiyasi",
      totalParts: atlas?.parts.length,
      totalConcepts: atlas?.concepts.length,
      visibleSystems: visible.map((id) => SYSTEM_BY_ID[id]?.name).filter(Boolean).join(", "),
      explodePercent: Math.round(explode * 100),
      isolated: isolate,
      selectedStructure: chosen ? `${translateName(chosen.name)} (${chosen.name}, ${chosen.id})` : undefined,
      selectedSystem: selectedParts[0] ? SYSTEM_BY_ID[selectedParts[0].system]?.name : undefined,
      selectedPieces: selected.length || undefined,
    }),
    [atlas, visible, explode, isolate, chosen, selectedParts, selected.length],
  );

  const failure = error || (manifestFailed ? "Anatomiya katalogi yuklanmadi. Sahifani yangilang." : "");
  const loadProgress = failure ? 100 : manifestLoading || !atlas ? 2 : progress;
  const sceneTag = isolate
    ? translateName(chosen?.name)
    : explode > 0.95
      ? "Anatomik inventar"
      : explode > 0.05
        ? "Ajratilgan tuzilmalar"
        : "Katta yoshli odam · erkak";

  return (
    <LabWorkspace
      {...BIO_WORKSPACE}
      eyebrow="Biologiya · BodyParts3D"
      title="Inson atlasi"
      description="2234 ta qism, 15 tizim. Aylantiring, yaqinlashtiring; qismni bossangiz tafsiloti chiqadi."
      items={PRESETS.map((p) => ({ id: p.id, name: p.name }))}
      activeId={preset}
      onSelect={applyPreset}
      aiContext={aiContext}
      scene={
        <>
          <Scene
            camera={[1.0, 0.18, 2.85]}
            frameloop="demand"
            bg={BIO_SCENE_BG}
            gl={BIO_GL}
            lights={false}
            controls={{
              minDistance: 0.05,
              maxDistance: 30,
              enablePan: true,
              zoomToCursor: true,
              zoomSpeed: 1.1,
              maxPolarAngle: Math.PI * 0.96,
            }}
          >
            {/* 1.8 m body: light distances in metres; the custom shader displaces parts, so no cast shadows. */}
            <BioStudio preset="organ" scale={2.2} shadow={false} />
            {atlas && (
              <AtlasBody
                atlas={atlas}
                visible={visible}
                selected={selected}
                isolate={isolate}
                explode={explode}
                onPick={pickPart}
                onProgress={(n) => setField("progress", n)}
                onError={(msg) => setField("error", msg)}
              />
            )}
          </Scene>

          <AtlasDetailCard
            chosen={chosen}
            parts={selectedParts}
            isolate={isolate}
            onIsolate={() => setFields({ isolate: !isolate, explode: 0 })}
            onPickPart={pickPart}
            onClose={clearSelection}
          />

          {/* Sahna sarlavhasi + tiklash (pastki chapda, toolbar'ga xalaqit bermaydi). */}
          <div className="pointer-events-none absolute bottom-5 left-4 z-20 hidden items-center gap-2 lg:flex">
            <span className="rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              {sceneTag}
            </span>
            <button
              onClick={resetAll}
              className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur hover:text-primary"
            >
              <RotateCcw size={11} /> Tiklash
            </button>
          </div>

          <BioLoading
            title="Anatomiya tayyorlanmoqda"
            subtitle={`${atlas?.parts.length.toLocaleString("uz") ?? "2 234"} ta qism · 15 tizim · meshopt siqilgan`}
            progress={loadProgress}
            error={failure}
            onRetry={() => location.reload()}
          />
        </>
      }
      info={
        <AtlasControls
          atlas={atlas}
          query={query}
          onQuery={(q) => setField("query", q)}
          onChoose={choose}
          explode={explode}
          onExplode={(v) => setFields({ explode: v, isolate: false })}
          visible={visible}
          onToggleSystem={toggleSystem}
          onOnlySystem={(id) => setVisible([id])}
          onVisible={setVisible}
          counts={counts}
          visibleCount={visibleCount}
        />
      }
    />
  );
};

export default HumanAtlasPage;
