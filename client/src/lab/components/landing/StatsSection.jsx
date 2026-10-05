import React from "react";
import { Layers, FlaskConical, Atom, Sparkles } from "lucide-react";

const STATS = [
  { value: "5", label: "Fan Yo'nalishi", sub: "Kimyo, Biologiya, Fizika, Elektronika, Tarix", icon: Atom, color: "#10b981" },
  { value: "206+", label: "Suyaklar & Organlar", sub: "4K PBR to'liq inson anatomiyasi", icon: Layers, color: "#06b6d4" },
  { value: "118", label: "Kimyoviy Elementlar", sub: "Reaksiyalar va eritma simulyatorlari", icon: FlaskConical, color: "#8b5cf6" },
  { value: "100%", label: "Interaktiv & Bepul", sub: "Brauzerda o'rnatishsiz ishlaydi", icon: Sparkles, color: "#f59e0b" },
];

export const StatsSection = () => (
  <section className="border-b border-zinc-800/80 bg-zinc-950/70 py-8 backdrop-blur-md">
    <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
      {STATS.map((item) => {
        const IconComp = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}35`,
                color: item.color,
              }}
            >
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {item.value}
              </div>
              <div className="text-xs font-bold text-zinc-300">
                {item.label}
              </div>
              <div className="text-[10px] text-zinc-500 hidden sm:block truncate max-w-[160px]">
                {item.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default StatsSection;
