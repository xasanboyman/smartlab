// Topics as numbered level nodes on a snaking path (desktop) or a vertical track (mobile).
import React from "react";
import { Link } from "react-router-dom";
import Icon from "@/lab/components/Icon";

const PER_ROW = 4;
const BOARD_W = 1000;
const ROW_H = 230;
const SIDE = 125;

const nodePoint = (i) => {
  const row = Math.floor(i / PER_ROW);
  const col = i % PER_ROW;
  const slot = row % 2 === 0 ? col : PER_ROW - 1 - col;
  return { x: SIDE + slot * ((BOARD_W - SIDE * 2) / (PER_ROW - 1)), y: 90 + row * ROW_H };
};

const buildPath = (count) => {
  let d = "";
  for (let i = 0; i < count; i++) {
    const p = nodePoint(i);
    if (i === 0) {
      d = `M${p.x} ${p.y}`;
      continue;
    }
    const prev = nodePoint(i - 1);
    if (prev.y === p.y) d += ` L${p.x} ${p.y}`;
    else {
      const bulge = p.x > BOARD_W / 2 ? p.x + 110 : p.x - 110;
      d += ` C${bulge} ${prev.y} ${bulge} ${p.y} ${p.x} ${p.y}`;
    }
  }
  return d;
};

const NodeTile = ({ number, icon, color, size = "lg" }) => (
  <span className="relative block w-fit">
    {/* Ambient glow behind node */}
    <span
      className="absolute -inset-2 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity"
      style={{ backgroundColor: color }}
    />
    <span
      className={`relative rounded-2xl grid place-items-center border-2 shadow-2xl transition-all duration-300 group-hover:scale-105 ${
        size === "lg" ? "size-20" : "size-14"
      }`}
      style={{
        backgroundColor: `${color}25`,
        borderColor: color,
        color: "#ffffff",
      }}
    >
      <Icon name={icon} size={size === "lg" ? 28 : 20} className="text-white" />
    </span>
    <span
      className="absolute -right-2.5 -top-2.5 grid size-7 place-items-center rounded-full border text-xs font-mono font-bold shadow-lg"
      style={{
        backgroundColor: "#090b12",
        borderColor: color,
        color: color,
      }}
    >
      {number}
    </span>
  </span>
);

const DesktopPath = ({ subject }) => {
  const { topics, color } = subject;
  const rows = Math.ceil(topics.length / PER_ROW);
  const height = 90 * 2 + (rows - 1) * ROW_H + 60;

  return (
    <div className="relative hidden w-full lg:block" style={{ aspectRatio: `${BOARD_W} / ${height}` }}>
      <svg viewBox={`0 0 ${BOARD_W} ${height}`} className="absolute inset-0 size-full pointer-events-none" fill="none" aria-hidden="true">
        <path d={buildPath(topics.length)} stroke={color} strokeOpacity="0.25" strokeWidth="16" strokeLinecap="round" />
        <path d={buildPath(topics.length)} stroke="#ffffff" strokeWidth="3" strokeDasharray="10 10" strokeLinecap="round" className="opacity-40" />
      </svg>

      {topics.map((topic, i) => {
        const p = nodePoint(i);
        return (
          <Link
            key={topic.slug}
            to={`/${subject.slug}/${topic.slug}`}
            className="group absolute flex w-52 -translate-x-1/2 -translate-y-10 flex-col items-center text-center focus-visible:outline-none"
            style={{ left: `${(p.x / BOARD_W) * 100}%`, top: `${(p.y / height) * 100}%` }}
          >
            {/* Hover card with description */}
            <div className="pointer-events-none absolute bottom-full z-20 mb-3 w-64 translate-y-1 p-3.5 rounded-2xl bg-zinc-950/95 border border-zinc-700/80 shadow-2xl text-left text-xs leading-relaxed text-zinc-300 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 backdrop-blur-xl">
              <div className="font-bold text-white mb-1">{topic.title}</div>
              <div className="text-zinc-400">{topic.short}</div>
            </div>

            <span className="transition-transform duration-200 group-hover:-translate-y-1.5 motion-reduce:transition-none">
              <NodeTile number={i + 1} icon={topic.icon} color={color} />
            </span>
            <span className="mt-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 px-3 py-1 font-semibold text-sm leading-tight text-zinc-200 group-hover:text-emerald-300 group-hover:border-zinc-700 backdrop-blur-md transition-colors shadow-md">
              {topic.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

const MobileTrack = ({ subject }) => (
  <ol className="relative space-y-4 lg:hidden">
    <span
      aria-hidden="true"
      className="absolute bottom-6 left-7 top-6 border-l-2 border-dashed"
      style={{ borderColor: `${subject.color}55` }}
    />
    {subject.topics.map((topic, i) => (
      <li key={topic.slug} className="relative">
        <Link to={`/${subject.slug}/${topic.slug}`} className="group flex items-center gap-4 focus-visible:outline-none">
          <NodeTile number={i + 1} icon={topic.icon} color={subject.color} size="sm" />
          <div className="min-w-0 flex-1 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md shadow-lg transition-transform duration-150 group-hover:-translate-y-0.5">
            <span className="block font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
              {topic.title}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-zinc-400">
              {topic.short}
            </span>
          </div>
        </Link>
      </li>
    ))}
  </ol>
);

const LevelPath = ({ subject }) => (
  <>
    <DesktopPath subject={subject} />
    <MobileTrack subject={subject} />
  </>
);

export default LevelPath;

