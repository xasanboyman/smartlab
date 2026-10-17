import { useSnap } from "@/shared/utils/snapStore";
import { cn } from "@/shared/utils/cn";
import KeyCap from "./KeyCap";

const InteractionPrompt = ({ world }) => {
  const { prompt, flash } = useSnap(world.hud);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+32px)] z-20 flex flex-col items-center gap-2 px-4 select-none animate-in fade-in zoom-in-95 duration-150">
      {prompt && (
        <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-950/90 px-5 py-2.5 text-white backdrop-blur-2xl border border-zinc-700/60 shadow-[0_10px_35px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <span className="text-sm font-bold tracking-tight text-zinc-100">{prompt.title}</span>
          {prompt.subtitle && (
            <span className="-mt-0.5 text-xs font-medium text-cyan-300/90">{prompt.subtitle}</span>
          )}
          {prompt.actions.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5 border-t border-white/10 pt-2">
              {prompt.actions.map((action) => (
                <span
                  key={action.label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium",
                    action.disabled
                      ? "text-amber-300 bg-amber-500/10 border border-amber-500/20"
                      : "text-zinc-200 bg-white/5 border border-white/10",
                  )}
                >
                  {action.keys.map((key) => (
                    <KeyCap key={key}>{key}</KeyCap>
                  ))}
                  <span>{action.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {flash && (
        <span
          key={flash.at}
          className="animate-flash-out rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-1.5 text-xs font-bold text-zinc-950 shadow-xl border border-amber-300/50"
        >
          {flash.text}
        </span>
      )}
    </div>
  );
};

export default InteractionPrompt;
