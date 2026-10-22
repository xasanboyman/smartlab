// "Eukariot hujayra": Draco GLB cell with clickable organelles (realistic) or a
// schematic sphere model. Selecting an organelle flies the camera to it and shows
// its Uzbek description in the detail card. All UI state in one object.
import { Suspense, useMemo } from "react";
import { Sparkles, Box, RefreshCw, Tag } from "lucide-react";
import useObjectState from "@/shared/hooks/useObjectState";
import { useAppTheme } from "@/shared/hooks/useAppTheme";
import Scene from "@/lab/components/Scene";
import LabWorkspace from "@/lab/components/LabWorkspace";
import { ORGANELLES, CELL_MODELS, getOrganelle, getCellModel } from "@/lab/data/cell";
import EukaryoticCellModel from "./EukaryoticCellModel";
import CellModel from "./CellModel";
import BioStudio from "../shared/BioStudio";
import { BIO_GL, BIO_SCENE_BG, BIO_WORKSPACE } from "../shared/bioTheme";
import { BioButton, BioDetailCard, BioLoading, BioPartList, BioSceneTag, BioSection, BioSegment, BioStat } from "../shared/BioUi";

const VIEW_MODES = [
  { id: "realistic", label: "Batafsil 3D", icon: <Sparkles size={13} /> },
  { id: "schematic", label: "Sxematik", icon: <Box size={13} /> },
];

const CellPage = () => {
  const { isDark } = useAppTheme();
  const { activeId, viewStyle, autoRotate, showLabels, focusKey, setField, setFields } = useObjectState({
    activeId: "eukaryotic-cell",
    viewStyle: "realistic",
    autoRotate: true,
    showLabels: true,
    focusKey: 0,
  });

  const model = getCellModel(activeId);
  const organelle = getOrganelle(activeId);
  const items = useMemo(
    () => [
      ...CELL_MODELS.map((m) => ({ id: m.id, name: m.name })),
      ...ORGANELLES.map((o) => ({ id: o.id, name: o.name, color: o.color })),
    ],
    [],
  );
  const listItems = useMemo(() => ORGANELLES.map((o) => ({ id: o.id, name: o.name, color: o.color })), []);

  // Selecting an organelle stops the turntable so the camera can settle on it.
  const select = (id) => setFields({ activeId: id, autoRotate: id === "eukaryotic-cell" ? autoRotate : false });

  const title = model ? model.name : organelle?.name || "Eukariot hujayra";
  const about = model ? model.about : organelle?.about || "";

  return (
    <LabWorkspace
      {...BIO_WORKSPACE}
      eyebrow="Biologiya · Sitologiya"
      title="Eukariot hujayra 3D"
      description="Organoid ustiga bosing yoki ro'yxatdan tanlang - kamera unga yaqinlashadi va tavsifi chiqadi."
      items={items}
      activeId={activeId}
      onSelect={select}
      scene={
        <>
          <Scene
            camera={[0, 1.8, 7.2]}
            bg={isDark ? BIO_SCENE_BG : "#f1f5f9"}
            gl={BIO_GL}
            lights={false}
            loader={null}
            controls={{ minDistance: 1.2, maxDistance: 16, enablePan: true }}
          >
            {/* 1M-triangle cell: no cast shadows (the contact shadow grounds it), keeps mobile GPUs smooth. */}
            <BioStudio preset="cell" scale={5} shadow={false} contact={{ y: -3.3, opacity: 0.55, scale: 14, blur: 2.6 }} />
            <Suspense fallback={null}>
              {viewStyle === "realistic" ? (
                <EukaryoticCellModel activeId={activeId} onSelect={select} autoRotate={autoRotate} showLabels={showLabels} focusKey={focusKey} />
              ) : (
                <CellModel activeId={activeId} onSelect={select} autoRotate={autoRotate} showLabels={showLabels} />
              )}
            </Suspense>
          </Scene>
          {viewStyle === "realistic" && <BioLoading title="Hujayra modeli yuklanmoqda" subtitle="Sketchfab · Draco siqilgan GLB (4,9 MB)" />}
          {organelle && (
            <BioDetailCard
              eyebrow="Organoid"
              title={organelle.name}
              color={organelle.color}
              description={organelle.about}
              onFocus={() => setFields({ focusKey: focusKey + 1, autoRotate: false })}
              onClose={() => select("eukaryotic-cell")}
            />
          )}
          <BioSceneTag>{viewStyle === "realistic" ? "Sketchfab · Draco · 1,0 mln uchburchak" : "Sxematik model"}</BioSceneTag>
        </>
      }
      info={
        <div className="space-y-5">
          <BioSection label="Ko'rinish">
            <BioSegment options={VIEW_MODES} value={viewStyle} onChange={(v) => setField("viewStyle", v)} />
            <div className="flex gap-1.5">
              <BioButton active={autoRotate} icon={<RefreshCw size={13} className={autoRotate ? "animate-spin" : ""} />} onClick={() => setField("autoRotate", !autoRotate)}>
                360°
              </BioButton>
              <BioButton active={showLabels} icon={<Tag size={13} />} onClick={() => setField("showLabels", !showLabels)}>
                Yorliqlar
              </BioButton>
            </div>
          </BioSection>

          <BioSection label="Organoidlar" right={<span className="font-mono text-[10px] text-muted-foreground">{ORGANELLES.length} ta</span>}>
            <BioPartList items={listItems} activeId={activeId} onSelect={select} placeholder="Organoidni qidiring…" />
          </BioSection>

          <BioSection label={model ? "Model" : "Tanlangan organoid"}>
            <div className="flex items-center gap-2">
              {organelle && <span className="size-2.5 rounded-full" style={{ background: organelle.color }} />}
              <h2 className="text-base font-semibold leading-tight">{title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{about}</p>
            {model && (
              <div className="grid grid-cols-2 gap-2">
                <BioStat label="Format" value="GLB · Draco" />
                <BioStat label="Organoidlar" value={`${ORGANELLES.length} ta`} accent />
              </div>
            )}
          </BioSection>
        </div>
      }
    />
  );
};

export default CellPage;
