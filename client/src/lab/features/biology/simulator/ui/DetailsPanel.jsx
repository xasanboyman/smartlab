// Right HUD: the active topic (description, vitals, fun fact), the searchable
// organ list and the keyboard cheat-sheet.
import { Crosshair, Search, ShieldCheck, Sparkles, Volume2, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ANATOMY_TOPICS, DISCLAIMER } from "../engine/anatomyData";
import { anatomyAudio } from "../engine/AnatomyAudio";
import { ICON_MAP, MONO_LABEL, SHORTCUTS } from "./constants";

const TABS = [
  { id: "tuzilish", label: "Tuzilishi" },
  { id: "azolar", label: "23 ta a'zo" },
  { id: "asboblar", label: "Klaviatura" },
];

const DetailsPanel = ({ topic, topicId, tab, onTab, query, onQuery, onSelectTopic, onFullBody, onClose, speaking, onNarrate }) => {
  const Icon = ICON_MAP[topic.icon] || Sparkles;
  const filtered = ANATOMY_TOPICS.filter((t) => {
    const q = query.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.latin.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold" title={topic.title}>{topic.title}</h2>
            <div className="truncate text-[11px] italic text-muted-foreground">{topic.latin}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {topicId !== "all" && (
            <button
              type="button"
              onClick={onFullBody}
              className="rounded-xl border border-primary/40 bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary transition-all hover:bg-primary/25"
              title="To'liq inson tanasini ko'rsatish"
            >
              To'liq tana
            </button>
          )}
          <button
            type="button"
            onClick={onNarrate}
            className={cn("rounded-xl border p-2 transition-all", speaking ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-background/70 text-muted-foreground hover:text-foreground")}
            title={speaking ? "Ovozni to'xtatish" : "Tushuntirishni eshitish"}
          >
            {speaking ? (
              <span className="flex h-3.5 items-center gap-0.5 px-0.5">
                <span className="h-3 w-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                <span className="h-3.5 w-1 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                <span className="h-2 w-1 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
              </span>
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border border-border bg-background/70 p-2 text-muted-foreground transition-all hover:text-foreground" title="Panelni yopish">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-border px-4 pt-2 text-xs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              anatomyAudio.playClick();
              onTab(t.id);
            }}
            className={cn("relative pb-2.5 font-semibold transition-all", tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "tuzilish" && (
        <div className="hidden-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <div className={MONO_LABEL}>Ilmiy tavsif va vazifasi</div>
            <p className="rounded-2xl border border-border bg-secondary/40 p-3.5 text-xs leading-relaxed">{topic.desc}</p>
          </div>
          {topic.stats?.length > 0 && (
            <div className="space-y-1.5">
              <div className={MONO_LABEL}>Asosiy ko'rsatkichlar</div>
              <div className="grid grid-cols-2 gap-2">
                {topic.stats.map((st, i) => (
                  <div key={i} className="rounded-xl border border-border bg-secondary/40 p-2.5">
                    <div className="truncate text-[10px] text-muted-foreground">{st.label}</div>
                    <div className="mt-0.5 truncate text-xs font-bold text-primary">{st.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topic.funFact && (
            <div className="space-y-1.5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3.5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
                <Sparkles className="size-3.5 shrink-0" />
                Qiziqarli tibbiy fakt
              </div>
              <p className="text-xs leading-relaxed">{topic.funFact}</p>
            </div>
          )}
        </div>
      )}

      {tab === "azolar" && (
        <div className="hidden-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="A'zoni qidirish (o'pka, jigar, yurak)…"
              className="h-9 w-full rounded-xl border border-border bg-background/70 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground/70 focus:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            {filtered.map((t) => {
              const TIcon = ICON_MAP[t.icon] || Sparkles;
              const on = topicId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTopic(t)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all",
                    on ? "border-primary/40 bg-primary/15 font-bold" : "border-border bg-secondary/30 hover:bg-secondary",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <TIcon className={cn("size-4 shrink-0", on ? "text-primary" : "text-muted-foreground")} />
                    <div className="min-w-0">
                      <div className="truncate text-xs">{t.title}</div>
                      <div className="truncate text-[10px] italic text-muted-foreground">{t.latin}</div>
                    </div>
                  </div>
                  <Crosshair className="size-3.5 shrink-0 text-muted-foreground/60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "asboblar" && (
        <div className="hidden-scrollbar flex-1 space-y-3 overflow-y-auto p-4 text-xs">
          <div className={MONO_LABEL}>Tezkor klaviatura tugmalari</div>
          <div className="space-y-2">
            {SHORTCUTS.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-2">
                <span>{item.desc}</span>
                <kbd className="ml-2 shrink-0 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-bold text-primary shadow-sm">{item.key}</kbd>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 text-[10px] leading-normal text-muted-foreground">{DISCLAIMER}</div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border bg-secondary/30 p-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>SmartLab 3D WebGL Engine</span>
        </div>
        <span className="font-mono">v3.1</span>
      </div>
    </>
  );
};

export default DetailsPanel;
