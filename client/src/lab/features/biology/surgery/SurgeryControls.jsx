// Left-panel controls for the dissection page: per-layer opacity sliders
// (peel away skin/muscle) + a scalpel section that drives the clipping plane.
import { FlipHorizontal2 } from "lucide-react";
import { SURGERY_LAYERS } from "@/lab/data/surgery";
import { BioButton, BioRange, BioSection, BioSegment, BioToggle } from "../shared/BioUi";

const AXES = [
  { id: "x", label: "Ko'ndalang" },
  { id: "y", label: "Bo'yiga" },
  { id: "z", label: "Old-orqa" },
];

const SurgeryControls = ({ layers, onLayer, clip, onClip }) => (
  <div className="space-y-6">
    <BioSection label="Qatlamlar" right={<span className="font-mono text-[10px] text-muted-foreground">tashqi → ichki</span>}>
      <div className="space-y-3">
        {SURGERY_LAYERS.map((l) => (
          <BioRange
            key={l.slug}
            label={l.title}
            color={l.color}
            value={Math.round((layers[l.slug] ?? 0) * 100)}
            onChange={(v) => onLayer(l.slug, v / 100)}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Tashqi qatlamni 0% ga tushirsangiz, ichkarisi ko'rinadi.</p>
    </BioSection>

    <BioSection label="Skalpel (kesish)">
      <BioToggle label="Kesimni yoqish" hint="Yumshoq to'qimani kesadi, a'zolar butun qoladi" checked={clip.enabled} onChange={(v) => onClip({ enabled: v })} />
      <div className={clip.enabled ? "space-y-3" : "pointer-events-none space-y-3 opacity-40"}>
        <BioSegment options={AXES} value={clip.axis} onChange={(axis) => onClip({ axis })} />
        <BioRange label="Kesish joyi" value={Math.round(clip.position * 100)} onChange={(v) => onClip({ position: v / 100 })} />
        <BioButton className="w-full" active={clip.flip} icon={<FlipHorizontal2 size={13} />} onClick={() => onClip({ flip: !clip.flip })}>
          Yo'nalishni almashtirish
        </BioButton>
      </div>
    </BioSection>
  </div>
);

export default SurgeryControls;
