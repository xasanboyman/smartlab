import Button from "@/shared/components/ui/button/Button";
import { cn } from "@/shared/utils/cn";
import { QUALITY_OPTIONS, TEXT } from "../data/labRoomContent";

const QualityPicker = ({ tier, recommended, onChange }) => (
  <section>
    <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">{TEXT.quality}</h2>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {QUALITY_OPTIONS.map((option) => {
        const active = tier === option.id;
        return (
          <Button
            key={option.id}
            variant="ghost"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              "h-auto flex-col items-start gap-1 whitespace-normal rounded-lg border px-3.5 py-2.5 text-left text-white hover:text-white transition-all",
              active
                ? "border-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                : "border-zinc-800/80 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {option.label}
              {recommended === option.id && (
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  {TEXT.recommended}
                </span>
              )}
            </span>
            <span className="text-xs font-normal text-white/60">{option.hint}</span>
          </Button>
        );
      })}
    </div>
  </section>
);

export default QualityPicker;
