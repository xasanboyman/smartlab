import React from "react";
import {
  Layers,
  Sparkles,
  FlaskConical,
  Bot,
  Glasses,
  Zap,
  Cpu,
  Scissors,
} from "lucide-react";
import BendCard from "@/shared/components/3d/html-in-canvas/BendCard";
import DecryptHeader from "@/shared/components/ui/DecryptHeader";

const FEATURES = [
  {
    icon: Layers,
    tag: "3D PBR",
    title: "4K 3D Anatomiya & Kesim",
    desc: "Inson tanasining 5 ta qatlami: 206 suyak, 600+ mushak va a'zolarni 3D o'qda kesib (slice) ichini o'rganing.",
    color: "#10b981",
  },
  {
    icon: Sparkles,
    tag: "CHROME 155",
    title: "HTML-in-Canvas Texnologiyasi",
    desc: "Veb standartlarining eng so'nggi imkoniyati: interaktiv HTML UI to'g'ridan-to'g'ri 3D fizik mato va WebGL teksturalariga chiziladi.",
    color: "#06b6d4",
  },
  {
    icon: FlaskConical,
    tag: "SIMULYATSIYA",
    title: "Kimyo & Molekulyar Laboratoriya",
    desc: "118 ta davriy jadval elementi, pH indikatorlari va realistik kimyoviy reaksiyalar bilan xavfsiz tajribalar.",
    color: "#3b82f6",
  },
  {
    icon: Bot,
    tag: "AI ASSISTANT",
    title: "Aqlli AI Ilmiy Hamroh",
    desc: "Laboratoriya tajribangizni kuzatib boruvchi sun'iy intellekt savollaringizga real vaqtda javob beradi.",
    color: "#8b5cf6",
  },
  {
    icon: Glasses,
    tag: "WEBXR",
    title: "Immersiv VR Laboratoriya",
    desc: "Meta Quest yoki mobil Cardboard ko'zoynaklari orqali 3D virtual olamga to'liq sho'ng'ing.",
    color: "#f43f5e",
  },
  {
    icon: Zap,
    tag: "60 FPS",
    title: "O'rnatishsiz, Brauzerda Ishlaydi",
    desc: "Hech qanday og'ir dastur o'rnatish shart emas. Havolani bosing va kompyuter yoki telefonda bir zumda ishga tushiring.",
    color: "#f59e0b",
  },
];

export const FeaturesSection = () => (
  <section className="py-20 md:py-28 bg-[#090b12] border-y border-zinc-800/80 relative">
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Innovatsion Imkoniyatlar</span>
        </div>
        <DecryptHeader
          text="Kelajak Ilmiy Laboratoriyasi"
          color="#10b981"
          className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
        />
        <p className="mt-3 text-zinc-400 text-sm md:text-base leading-relaxed">
          Darslikdagi statik rasmlar endi o'tmishda qoldi. 3D WebGL va sun'iy intellekt kuchi bilan har bir tajribani boshqaring.
        </p>
      </div>

      {/* Cards Grid with CanvasUI 3D Bend */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((item) => {
          const IconComp = item.icon;
          return (
            <BendCard key={item.title} zone={40} angle={14} perspective={950} tilt={0.25} className="h-full">
              <div
                className="group p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700/80 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full"
              >
                {/* Subtle hover gradient */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at top left, ${item.color}, transparent 70%)`,
                  }}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${item.color}1a`,
                        borderColor: `${item.color}40`,
                        color: item.color,
                      }}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        borderColor: `${item.color}33`,
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center text-xs font-semibold text-zinc-500 group-hover:text-emerald-400 transition-colors">
                  <span>Batafsil tanishish ➔</span>
                </div>
              </div>
            </BendCard>
          );
        })}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
