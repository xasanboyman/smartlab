// Shared lookup tables for the anatomy simulator UI (icons stay code values).
import { Activity, Bone, Brain, Droplets, Dumbbell, Eye, Flame, Heart, HeartPulse, Layers, User, UtensilsCrossed, Wind } from "lucide-react";

export const ICON_MAP = { Bone, Dumbbell, HeartPulse, Layers, User, Heart, Wind, Brain, Activity, UtensilsCrossed, Droplets, Flame, Eye };

export const LEVER_TIERS = [
  { p: 100, label: "Teri", sub: "Tashqi qoplama", icon: User },
  { p: 75, label: "Mushaklar", sub: "600+ faol tola", icon: Dumbbell },
  { p: 50, label: "Qon-tomir", sub: "Arteriya & vena", icon: HeartPulse },
  { p: 25, label: "A'zolar", sub: "Ichki organlar", icon: Activity },
  { p: 0, label: "Skelet", sub: "206 ta suyak", icon: Bone },
];

export const CAMERA_REGIONS = [
  { id: "all", label: "To'liq", icon: User },
  { id: "head", label: "Bosh", icon: Brain },
  { id: "chest", label: "Ko'krak", icon: Wind },
  { id: "abdomen", label: "Qorin", icon: Activity },
  { id: "pelvis", label: "Tos", icon: Bone },
  { id: "legs", label: "Oyoqlar", icon: Dumbbell },
];

export const AXES = [
  { id: "horizontal", label: "Gorizontal", defaultDir: "top_to_below" },
  { id: "vertical_x", label: "Sagittal", defaultDir: "left_to_right" },
  { id: "vertical_z", label: "Koronal", defaultDir: "front_to_back" },
];

export const DIRECTIONS = {
  horizontal: [
    { id: "top_to_below", label: "Yuqoridan ↓" },
    { id: "below_to_top", label: "Pastdan ↑" },
  ],
  vertical_x: [
    { id: "left_to_right", label: "Chapdan →" },
    { id: "right_to_left", label: "O'ngdan ←" },
  ],
  vertical_z: [
    { id: "front_to_back", label: "Oldindan →" },
    { id: "back_to_front", label: "Orqadan ←" },
  ],
};

export const SLICE_PRESETS = [
  { key: "chest_coronal", label: "Ko'krak & yurak", title: "Ko'krak qafasini old tomondan ochib, yurak va o'pkani ko'rsatish", match: { region: "chest", axis: "vertical_z" } },
  { key: "head_sagittal", label: "Bosh & miya", title: "Kalla suyagini sagittal kesib, bosh miyani ko'rsatish", match: { region: "head", axis: "vertical_x" } },
  { key: "chest_transverse", label: "Ko'ndalang (KT)", title: "Ko'krak qafasini ko'ndalang kesimda tekshirish (KT / MRT)", match: { region: "chest", axis: "horizontal" } },
  { key: "all_coronal", label: "To'liq koronal", title: "To'liq tana bo'ylab oldindan orqaga qarab kesish", match: { region: "all", axis: "vertical_z" } },
];

// Values a preset writes into the slice state (focusRegion is applied by the page).
export const SLICE_PRESET_VALUES = {
  chest_coronal: { region: "chest", axis: "vertical_z", direction: "front_to_back", position: 38, angle: 0, tilt: 0 },
  head_sagittal: { region: "head", axis: "vertical_x", direction: "left_to_right", position: 50, angle: 0, tilt: 0 },
  chest_transverse: { region: "chest", axis: "horizontal", direction: "top_to_below", position: 50, angle: 0, tilt: 0 },
  all_coronal: { region: "all", axis: "vertical_z", direction: "front_to_back", position: 38, angle: 0, tilt: 0 },
  all_sagittal: { region: "all", axis: "vertical_x", direction: "left_to_right", position: 50, angle: 0, tilt: 0 },
};

export const SHORTCUTS = [
  { key: "Space", desc: "360° avto-aylantirish" },
  { key: "C", desc: "Kesim tekisligini qo'shish / yopish" },
  { key: "P", desc: "Anatomik xarita belgilarini ko'rsatish" },
  { key: "X", desc: "Teri rentgen (shaffof) rejimi" },
  { key: "B", desc: "Biologik jarayonlar paneli" },
  { key: "T", desc: "Kunduzgi / tungi studiya" },
  { key: "M", desc: "Ovoz effektlarini yoqish / o'chirish" },
  { key: "R", desc: "Kamerani boshlang'ich holatga keltirish" },
  { key: "F", desc: "To'liq ekran rejimi" },
  { key: "1 - 5", desc: "1: Skelet, 2: A'zolar, 3: Qon-tomir, 4: Mushaklar, 5: Teri" },
];

// Button looks shared by the simulator panels (semantic tokens follow the day/night vars).
export const BTN = "rounded-lg border border-border bg-background/70 text-foreground transition-colors hover:border-primary/40 hover:bg-secondary";
export const BTN_SM = `${BTN} px-2 py-1.5 text-[11px] font-semibold`;
export const ACTIVE_AMBER = "border-amber-400 bg-amber-500 text-zinc-950 font-bold";
export const ACTIVE_AMBER_SOFT = "border-amber-500/60 bg-amber-500/20 text-amber-500";
export const ACTIVE_SKY = "border-sky-500/60 bg-sky-500/20 text-sky-500";
export const ACTIVE_PRIMARY = "border-primary/60 bg-primary/15 text-primary";
export const MONO_LABEL = "font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300 dark:text-zinc-200";
