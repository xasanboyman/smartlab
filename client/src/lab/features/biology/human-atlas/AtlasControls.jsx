// Chap panel: qidiruv (3432 tushuncha), portlatish slayderi va 15 tizim
// ko'rinuvchanligi. Barcha holat sahifada (HumanAtlasPage) turadi.
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { SYSTEMS, FEATURED_CONCEPTS, translateName } from "./data/systems";
import { BioRange, BioSearch, BioSection } from "../shared/BioUi";

const MAX_RESULTS = 40;

const AtlasControls = ({
  atlas,
  query,
  onQuery,
  onChoose,
  explode,
  onExplode,
  visible,
  onToggleSystem,
  onOnlySystem,
  onVisible,
  counts,
  visibleCount,
}) => {
  // Qidiruv inglizcha manba nomi va o'zbekcha tarjima bo'yicha ishlaydi.
  const results = useMemo(() => {
    if (!atlas) return [];
    const term = query.toLowerCase().trim();
    if (!term)
      return FEATURED_CONCEPTS.map((name) =>
        atlas.concepts.find((c) => c.name.toLowerCase() === name),
      ).filter(Boolean);
    return atlas.concepts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          translateName(c.name).toLowerCase().includes(term),
      )
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, MAX_RESULTS);
  }, [atlas, query]);

  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0);

  return (
    <div className="space-y-6">
      <BioSection label="Tuzilmani qidirish" right={atlas && <span className="font-mono text-[10px] text-muted-foreground">{atlas.concepts.length.toLocaleString("uz")} tushuncha</span>}>
        <BioSearch value={query} onChange={onQuery} placeholder="Yurak, femur, buyrak…" />
        <ul className="hidden-scrollbar max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-background/40 p-1">
          {results.length === 0 && (
            <li className="px-2 py-3 text-center text-xs text-muted-foreground">{atlas ? "Hech narsa topilmadi." : "Katalog yuklanmoqda…"}</li>
          )}
          {results.map((c) => {
            const uz = translateName(c.name);
            return (
              <li key={c.id}>
                <button
                  onClick={() => onChoose(c)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{uz}</span>
                    {uz.toLowerCase() !== c.name.toLowerCase() && (
                      <span className="block truncate text-[11px] text-muted-foreground">{c.name}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    {c.elements.length} <ChevronRight size={11} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          {query ? `Eng ko'pi ${MAX_RESULTS} ta natija. Kichik tuzilmalar uchun aniqroq yozing.` : "Asosiy a'zolar. Istalgan nomni inglizcha yoki o'zbekcha yozing."}
        </p>
      </BioSection>

      <BioSection label="Portlatish">
        <BioRange label="Qismlarni ajratish" value={Math.round(explode * 100)} onChange={(v) => onExplode(v / 100)} />
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Yig'ilgan</span>
          <span>Har bir qism</span>
        </div>
      </BioSection>

      <BioSection
        label="Tizimlar"
        right={
          <div className="flex gap-1 font-mono text-[10px] uppercase tracking-wider">
            <button onClick={() => onVisible(activeSystems.map((s) => s.id))} className="rounded px-1.5 py-0.5 text-primary hover:bg-secondary">
              Hammasi
            </button>
            <button onClick={() => onVisible([])} className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-secondary">
              Yashirish
            </button>
          </div>
        }
      >
        <ul className="space-y-0.5 rounded-lg border border-border bg-background/40 p-1">
          {activeSystems.map((s) => {
            const on = visible.includes(s.id);
            return (
              <li key={s.id} className={cn("flex items-center gap-2 rounded-md px-1.5 py-1 text-xs", on ? "" : "opacity-50")}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggleSystem(s.id)}
                  aria-label={`${s.name} tizimini ko'rsatish`}
                  className="accent-primary"
                />
                <button
                  onClick={() => onOnlySystem(s.id)}
                  title={`Faqat ${s.name.toLowerCase()}`}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left hover:text-primary"
                >
                  <span className="size-2.5 shrink-0 rounded-full ring-1 ring-white/10" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name}</span>
                </button>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{counts[s.id]}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground">{visibleCount.toLocaleString("uz")} ta qism ko'rinmoqda. Nomni bossangiz faqat shu tizim qoladi.</p>
      </BioSection>

      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Manba: BodyParts3D 4.0, © The Database Center for Life Science, CC BY 4.0. Katta yoshli erkak
        etalon anatomiyasi; ta'lim uchun, tibbiy tashxis vositasi emas.
      </p>
    </div>
  );
};

export default AtlasControls;
