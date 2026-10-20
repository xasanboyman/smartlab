// Tanlangan tuzilma kartasi (yuqori o'ng burchak): o'zbekcha nom, manba nomi,
// tizim, izoh, FMA identifikatori va ajratib ko'rsatish tugmasi.
import { ChevronRight, Focus } from "lucide-react";
import { SYSTEM_BY_ID, translateName, explanation } from "./data/systems";
import { BioButton, BioDetailCard } from "../shared/BioUi";

const MAX_MEMBERS = 30;

const AtlasDetailCard = ({ chosen, parts, isolate, onIsolate, onPickPart, onClose }) => {
  if (!chosen || parts.length === 0) return null;
  const first = parts[0];
  const system = SYSTEM_BY_ID[first.system];
  const uz = translateName(chosen.name);
  const info = explanation(chosen.name, first.system);

  return (
    <BioDetailCard
      eyebrow={system?.name || "Anatomiya"}
      title={uz}
      subtitle={uz.toLowerCase() !== chosen.name.toLowerCase() ? chosen.name : undefined}
      color={system?.color}
      description={info.text}
      stats={[
        { label: "Atlas kodi", value: chosen.id },
        { label: "Tanlangan qismlar", value: parts.length.toLocaleString("uz") },
      ]}
      onClose={onClose}
      actions={
        <>
          <BioButton active={isolate} icon={<Focus size={13} />} onClick={onIsolate}>
            {isolate ? "Atrofini ko'rsatish" : "Ajratib ko'rsatish"}
          </BioButton>
          <BioButton onClick={onClose}>Bekor qilish</BioButton>
        </>
      }
    >
      {!info.specific && (
        <p className="mt-1 text-[11px] text-muted-foreground/80">Tizim haqida umumiy izoh. Tuzilma manba anatomiyasidan aniqlangan.</p>
      )}
      {parts.length > 1 && (
        <div className="mt-3">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tarkibidagi tuzilmalar</h4>
          <ul className="hidden-scrollbar mt-1 max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-border p-1">
            {parts.slice(0, MAX_MEMBERS).map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onPickPart(p.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-secondary"
                >
                  <span className="truncate">{translateName(p.name)}</span>
                  <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
          {parts.length > MAX_MEMBERS && (
            <p className="mt-1 text-[11px] text-muted-foreground">Yana {parts.length - MAX_MEMBERS} ta qism.</p>
          )}
        </div>
      )}
    </BioDetailCard>
  );
};

export default AtlasDetailCard;
