// Physiological engine popup (lazy chunk): heartbeat (BPM), breathing and the
// stethoscope sound toggle. One `bio` object in, patches out.
import { Activity, Heart, HeartPulse, Volume2, Wind, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { anatomyAudio } from "../engine/AnatomyAudio";

const Pill = ({ on, onClick, children }) => (
  <button
    type="button"
    onClick={() => {
      anatomyAudio.playClick();
      onClick();
    }}
    className={cn("rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold", on ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground")}
  >
    {children}
  </button>
);

const BioEngineModal = ({ bio, onChange, onClose }) => (
  <div className="animate-in fade-in zoom-in-95 absolute right-0 top-12 z-50 w-80 space-y-3.5 rounded-2xl border border-border bg-card/95 p-4 text-foreground shadow-2xl backdrop-blur duration-150">
    <div className="flex items-center justify-between border-b border-border pb-2">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg border border-rose-500/30 bg-rose-500/15">
          <HeartPulse className="size-4 animate-pulse text-rose-500" />
        </div>
        <div>
          <h4 className="text-xs font-bold">Biologik hayot simulyatsiyasi</h4>
          <p className="text-[10px] text-muted-foreground">Yurak sikli va o'pka nafas olishi</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
        <X className="size-3.5" />
      </button>
    </div>

    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-2.5">
      <div className="flex items-center gap-2">
        <Activity className="size-4 text-emerald-400" />
        <div>
          <div className="text-xs font-semibold">Tirik tana simulyatsiyasi</div>
          <div className="text-[10px] text-muted-foreground">Barcha fiziologik harakatlar</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          anatomyAudio.playClick();
          onChange({ active: !bio.active });
        }}
        className={cn("rounded-xl px-3 py-1 text-xs font-bold transition-all", bio.active ? "bg-emerald-500 text-white shadow-sm" : "bg-secondary text-muted-foreground")}
      >
        {bio.active ? "Faol" : "To'xtatilgan"}
      </button>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold">
          <Heart className="size-3.5 text-rose-500" /> Yurak urishi (lub-dub)
        </span>
        <Pill on={bio.heart} onClick={() => onChange({ heart: !bio.heart })}>{bio.heart ? "ON" : "OFF"}</Pill>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Puls tezligi</span>
          <span className="font-mono font-bold text-rose-500">{bio.bpm} BPM</span>
        </div>
        <input
          type="range"
          min="50"
          max="140"
          step="1"
          value={bio.bpm}
          onChange={(e) => onChange({ bpm: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer rounded-lg bg-secondary accent-rose-500"
        />
        <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
          <span>50 (tinch)</span>
          <span>72 (normal)</span>
          <span>140 (sport)</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {[
          { label: "Tinch", bpm: 60 },
          { label: "Normal", bpm: 72 },
          { label: "Yuklama", bpm: 110 },
        ].map((p) => (
          <button
            key={p.bpm}
            type="button"
            onClick={() => {
              anatomyAudio.playClick();
              onChange({ bpm: p.bpm });
            }}
            className={cn(
              "rounded-xl border px-2 py-1.5 text-[10px] font-semibold transition-all",
              bio.bpm === p.bpm ? "border-rose-500/50 bg-rose-500/20 font-bold text-rose-400" : "border-border bg-background/60 text-muted-foreground hover:bg-secondary",
            )}
          >
            {p.label} · {p.bpm}
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold">
          <Wind className="size-3.5 text-sky-400" /> O'pka & nafas
        </span>
        <Pill on={bio.breathing} onClick={() => onChange({ breathing: !bio.breathing })}>{bio.breathing ? "ON" : "OFF"}</Pill>
      </div>
      <p className="text-[10px] text-muted-foreground">O'pka to'qimasi, diafragma va ko'krak qafasi nafas ritmida kengayadi va qisqaradi.</p>
    </div>

    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-2.5">
      <div className="flex items-center gap-2">
        <Volume2 className="size-3.5 text-rose-400" />
        <div>
          <div className="text-xs font-semibold">Stetoskop ovozi</div>
          <div className="text-[10px] text-muted-foreground">Akustik yurak urishi</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          anatomyAudio.playClick();
          onChange({ acoustic: !bio.acoustic });
        }}
        className={cn("rounded-xl px-2.5 py-1 text-xs font-bold transition-all", bio.acoustic ? "bg-rose-500 text-white shadow-sm" : "bg-secondary text-muted-foreground")}
      >
        {bio.acoustic ? "Yoqilgan" : "O'chirilgan"}
      </button>
    </div>
  </div>
);

export default BioEngineModal;
