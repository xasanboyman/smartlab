// "Jarrohlik" - virtual dissection. Preset pills set the peel depth; the left
// panel adds per-layer opacity + a scalpel (clipping plane). Clicking a part
// opens its Uzbek detail in the corner card. All UI state in one object.
import useObjectState from "@/shared/hooks/useObjectState";
import Scene from "@/lab/components/Scene";
import LabWorkspace from "@/lab/components/LabWorkspace";
import SurgeryModel from "./SurgeryModel";
import SurgeryControls from "./SurgeryControls";
import { SURGERY_PRESETS, SURGERY_LAYERS, DEFAULT_PRESET, getPreset } from "@/lab/data/surgery";
import BioStudio from "../shared/BioStudio";
import { BIO_GL, BIO_SCENE_BG, BIO_WORKSPACE } from "../shared/bioTheme";
import { BioDetailCard, BioLoading, BioSceneTag } from "../shared/BioUi";

const SurgeryPage = () => {
  const { preset, layers, clip, selectedPart, setField, setFields } = useObjectState({
    preset: DEFAULT_PRESET,
    layers: { ...getPreset(DEFAULT_PRESET).layers },
    clip: { enabled: false, axis: "z", position: 0.5, flip: false },
    selectedPart: null,
  });

  // Presets replace the whole layer set; manual sliders clear the active pill.
  const applyPreset = (id) =>
    setFields({ preset: id, layers: { ...getPreset(id).layers }, selectedPart: null });
  const setLayer = (slug, value) =>
    setFields({ preset: null, layers: { ...layers, [slug]: value } });
  const setClip = (patch) => setField("clip", { ...clip, ...patch });

  const visibleLayers = SURGERY_LAYERS.filter((l) => (layers[l.slug] ?? 0) > 0.02).map((l) => l.title);

  return (
    <LabWorkspace
      {...BIO_WORKSPACE}
      eyebrow="Biologiya · Anatomiya"
      title="Jarrohlik"
      description="Qatlamlarni shaffoflashtiring yoki skalpel bilan kesib, ichki a'zolarni ko'ring. A'zoni bossangiz tafsiloti chiqadi."
      items={SURGERY_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
      activeId={preset}
      onSelect={applyPreset}
      aiContext={{ korinayotgan_qatlamlar: visibleLayers.join(", "), skalpel: clip.enabled ? `${clip.axis} o'qi, ${Math.round(clip.position * 100)}%` : "o'chiq" }}
      scene={
        <>
          <Scene
            camera={[0, 1, 6]}
            frameloop="demand"
            bg={BIO_SCENE_BG}
            gl={{ ...BIO_GL, localClippingEnabled: true }}
            lights={false}
            controls={{
              minDistance: 0.5,
              maxDistance: 30,
              enablePan: true,
              zoomToCursor: true,
              zoomSpeed: 1.1,
            }}
          >
            {/* Millions of triangles: no cast shadows, a static contact shadow grounds the body instead. */}
            <BioStudio preset="organ" scale={4} shadow={false} contact={{ y: -1.9, opacity: 0.5, scale: 6, blur: 2 }} />
            <SurgeryModel
              layerOpacity={layers}
              clip={clip}
              frozen={!!selectedPart}
              onPick={(part) => setField("selectedPart", part)}
            />
          </Scene>
          <BioLoading title="Anatomik qatlamlar yuklanmoqda" subtitle="Teri · mushaklar · qon-tomir · ichki a'zolar (Draco)" />
          {selectedPart && (
            <BioDetailCard
              eyebrow="Tanlangan tuzilma"
              title={selectedPart.label}
              color={selectedPart.color}
              description={selectedPart.desc}
              onClose={() => setField("selectedPart", null)}
            />
          )}
          <BioSceneTag>{clip.enabled ? `Skalpel · ${Math.round(clip.position * 100)}%` : visibleLayers.join(" · ") || "Qatlamlar yashirilgan"}</BioSceneTag>
        </>
      }
      info={<SurgeryControls layers={layers} onLayer={setLayer} clip={clip} onClip={setClip} />}
    />
  );
};

export default SurgeryPage;
