// "DNK spirali": procedural double helix. Picking a base highlights it on both
// strands and explains its pairing rule.
import { RefreshCw, Tag } from "lucide-react";
import useObjectState from "@/shared/hooks/useObjectState";
import { useAppTheme } from "@/shared/hooks/useAppTheme";
import Scene from "@/lab/components/Scene";
import LabWorkspace from "@/lab/components/LabWorkspace";
import DnaModel, { BASES } from "./DnaModel";
import BioStudio from "../shared/BioStudio";
import { BIO_GL, BIO_SCENE_BG, BIO_WORKSPACE } from "../shared/bioTheme";
import { BioButton, BioDetailCard, BioSceneTag, BioSection, BioStat } from "../shared/BioUi";

const ITEMS = [{ id: "dna", name: "Qo'sh spiral" }, ...BASES.map((b) => ({ id: b.id, name: `${b.letter} · ${b.name}` }))];

const DnaPage = () => {
  const { isDark } = useAppTheme();
  const { activeId, autoRotate, showLabels, setField } = useObjectState({ activeId: "dna", autoRotate: true, showLabels: true });
  const base = BASES.find((b) => b.id === activeId) || null;
  const pair = base ? BASES.find((b) => b.id === base.pair) : null;

  return (
    <LabWorkspace
      {...BIO_WORKSPACE}
      eyebrow="Biologiya · Molekulyar genetika"
      title="DNK spirali"
      description="Qo'sh spiralni aylantiring; azot asosini tanlasangiz, u ikkala ipda yoritiladi."
      items={ITEMS}
      activeId={activeId}
      onSelect={(id) => setField("activeId", id)}
      aiContext={{ tanlangan_asos: base ? `${base.name} (${base.letter}) - ${base.pair} bilan ${base.bonds} vodorod bog'i` : undefined }}
      scene={
        <>
          <Scene camera={[0, 0.4, 9.5]} bg={isDark ? BIO_SCENE_BG : "#f1f5f9"} gl={BIO_GL} lights={false} shadows controls={{ minDistance: 3, maxDistance: 20 }}>
            <BioStudio preset="molecule" scale={6} contact={{ y: -3.6, opacity: 0.45, scale: 12, blur: 2.4 }} />
            <DnaModel activeBase={base?.id || null} autoRotate={autoRotate} showLabels={showLabels} />
          </Scene>
          {base && (
            <BioDetailCard
              eyebrow={`Azot asosi · ${base.type}`}
              title={`${base.name} (${base.letter})`}
              color={base.color}
              description={base.about}
              stats={[
                { label: "Juftlashadi", value: `${pair.name} (${pair.letter})` },
                { label: "Vodorod bog'lari", value: `${base.bonds} ta` },
              ]}
              onClose={() => setField("activeId", "dna")}
            />
          )}
          <BioSceneTag>Qo'sh spiral · {BASES.length} asos · 24 juft</BioSceneTag>
        </>
      }
      info={
        <div className="space-y-5">
          <BioSection label="Ko'rinish">
            <div className="flex gap-1.5">
              <BioButton active={autoRotate} icon={<RefreshCw size={13} className={autoRotate ? "animate-spin" : ""} />} onClick={() => setField("autoRotate", !autoRotate)}>
                Aylantirish
              </BioButton>
              <BioButton active={showLabels} icon={<Tag size={13} />} onClick={() => setField("showLabels", !showLabels)}>
                Yorliqlar
              </BioButton>
            </div>
          </BioSection>

          <BioSection label="Tuzilishi">
            <p className="text-sm leading-relaxed text-muted-foreground">
              DNK - irsiy axborotni saqlovchi molekula. Ikki shakar-fosfat ipi o'zaro buralib qo'sh spiral hosil qiladi;
              ular azot asoslarining komplementar juftlari (A=T, G≡C) bilan bog'lanadi.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <BioStat label="Spiral diametri" value="2 nm" />
              <BioStat label="Bir o'ram" value="10 juft · 3,4 nm" />
            </div>
          </BioSection>

          <BioSection label="Azot asoslari">
            <div className="grid grid-cols-2 gap-1.5">
              {BASES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setField("activeId", b.id)}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-colors ${
                    activeId === b.id ? "border-primary/60 bg-primary/10" : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className="grid size-6 place-items-center rounded font-mono text-xs font-bold text-white" style={{ backgroundColor: b.color }}>
                    {b.letter}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{b.name}</span>
                    <span className="block font-mono text-[10px] uppercase text-muted-foreground">{b.type}</span>
                  </span>
                </button>
              ))}
            </div>
          </BioSection>
        </div>
      }
    />
  );
};

export default DnaPage;
