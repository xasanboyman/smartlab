import skinUrl from "@/shared/assets/models/skin.glb?url";
import myologyUrl from "@/shared/assets/models/myology.glb?url";
import heartUrl from "@/shared/assets/models/human_heart_3d_model.glb?url";
import lungsUrl from "@/shared/assets/models/realistic_human_lungs.glb?url";
import angiologyUrl from "@/shared/assets/models/angiology.glb?url";
import neurologyUrl from "@/shared/assets/models/neurology.glb?url";
import splanchnologyUrl from "@/shared/assets/models/splanchnology.glb?url";
import digestiveSystemUrl from "@/shared/assets/models/digestive_system.glb?url";
import liverUrl from "@/shared/assets/models/human_liver_and_gallbladder.glb?url";
import kidneyUrl from "@/shared/assets/models/human_kidney.glb?url";
import skullUrl from "@/shared/assets/models/skull.glb?url";
import orbitEyeUrl from "@/shared/assets/models/muscles_of_the_orbit_eye.glb?url";
import skeletonUrl from "@/shared/assets/models/skeleton.glb?url";
import diaphragmUrl from "@/shared/assets/models/human_diaphragm.glb?url";

export const MODEL_URLS = {
  skin: skinUrl,
  muscles: myologyUrl,
  myology: myologyUrl,
  heart: heartUrl,
  lungs: lungsUrl,
  angiology: angiologyUrl,
  circulatory: angiologyUrl,
  neurology: neurologyUrl,
  brain: neurologyUrl,
  splanchnology: splanchnologyUrl,
  digestive: digestiveSystemUrl,
  stomach: digestiveSystemUrl,
  intestines: digestiveSystemUrl,
  liver: liverUrl,
  kidneys: kidneyUrl,
  kidney: kidneyUrl,
  skull: skullUrl,
  eye: orbitEyeUrl,
  skeleton: skeletonUrl,
  diaphragm: diaphragmUrl,
};

export const SYSTEMS = {
  skin: { name: "Teri qoplami (Tana yuzasi)", short: "Teri", color: "#e8b89b", defaultVisible: true, defaultOpacity: 0.45 },
  organs: { name: "Ichki a'zolar (Splanxnologiya)", short: "A'zolar", color: "#f43f5e", defaultVisible: true, defaultOpacity: 1.0 },
  skeleton: { name: "Skelet (206 ta suyak)", short: "Skelet", color: "#f1f5f9", defaultVisible: true, defaultOpacity: 1.0 },
  vessels: { name: "Qon-tomir tizimi (Angiologiya)", short: "Qon-tomir", color: "#3b82f6", defaultVisible: true, defaultOpacity: 0.95 },
  muscles: { name: "Mushaklar tizimi (Miologiya)", short: "Mushaklar", color: "#dc2626", defaultVisible: true, defaultOpacity: 0.9 },
};

export const BODY_LAYERS = [
  { id: "skin", name: "Teri qoplami", short: "Teri", icon: "🧍", url: skinUrl, color: "#e8b89b", defaultOpacity: 0.45, explodeX: -2.0 },
  { id: "organs", name: "Ichki a'zolar", short: "A'zolar", icon: "🫁", url: splanchnologyUrl, color: "#f43f5e", defaultOpacity: 1.0, explodeX: -1.0 },
  { id: "skeleton", name: "Skelet (Suyaklar)", short: "Skelet", icon: "💀", url: skeletonUrl, color: "#f1f5f9", defaultOpacity: 1.0, explodeX: 0 },
  { id: "vessels", name: "Qon-tomir tizimi", short: "Qon-tomir", icon: "🩸", url: angiologyUrl, color: "#3b82f6", defaultOpacity: 0.95, explodeX: 1.0 },
  { id: "muscles", name: "Mushaklar tizimi", short: "Mushaklar", icon: "💪", url: myologyUrl, color: "#dc2626", defaultOpacity: 0.9, explodeX: 2.0 },
];

export const THREE_STAGES = [
  {
    id: "stage_assembled",
    time: 0,
    explode: 0.0,
    badge: "00:00",
    label: "To'liq tana (Yig'ilgan)",
    desc: "Barcha 5 ta anatomik tizim bitta yaxlit inson qiyofasida birlashgan.",
    cameraDistance: 4.8,
  },
  {
    id: "stage_peeling",
    time: 6,
    explode: 0.35,
    badge: "00:06",
    label: "Mushaklar va Teri ajralishi",
    desc: "Tashqi teri va mushak tolalari alohida qatlam sifatida ochiladi.",
    cameraDistance: 5.6,
  },
  {
    id: "stage_exploded",
    time: 14,
    explode: 1.0,
    badge: "00:14",
    label: "Portlatilgan atlas (5 ta tizim)",
    desc: "Teri, Ichki a'zolar, Skelet, Qon tomirlar va Mushaklar to'liq yonma-yon.",
    cameraDistance: 7.6,
  },
  {
    id: "stage_focus_skeleton",
    time: 21,
    explode: 0.75,
    badge: "00:21",
    label: "Skelet va Ichki a'zolar",
    desc: "206 suyakli tayanch karkasi va hayotiy muhim ichki a'zolar markazda.",
    cameraDistance: 6.2,
  },
  {
    id: "stage_reassembly",
    time: 28,
    explode: 0.1,
    badge: "00:28",
    label: "Qayta yig'ilish",
    desc: "Barcha qismlar qaytadan o'zaro birlashib yaxlit tanaga aylanadi.",
    cameraDistance: 5.0,
  },
];

export const BODY_PRESETS = [
  {
    id: "exploded",
    name: "💥 Portlatilgan (5 Tizim)",
    explode: 1.0,
    layers: { skin: 1.0, organs: 1.0, skeleton: 1.0, vessels: 1.0, muscles: 1.0 },
    opacities: { skin: 0.9, organs: 1.0, skeleton: 1.0, vessels: 0.95, muscles: 0.95 },
  },
  {
    id: "assembled",
    name: "🧍 Yaxlit Inson (Hammasi)",
    explode: 0.0,
    layers: { skin: 0.35, organs: 1.0, skeleton: 1.0, vessels: 0.95, muscles: 0.9 },
    opacities: { skin: 0.35, organs: 1.0, skeleton: 1.0, vessels: 0.95, muscles: 0.9 },
  },
  {
    id: "skeleton_only",
    name: "💀 Skelet (206 suyak)",
    explode: 0.0,
    layers: { skin: 0, organs: 0, skeleton: 1.0, vessels: 0, muscles: 0 },
    opacities: { skin: 0, organs: 0, skeleton: 1.0, vessels: 0, muscles: 0 },
  },
  {
    id: "muscles_only",
    name: "💪 Mushaklar anatomiyasi",
    explode: 0.0,
    layers: { skin: 0, organs: 0, skeleton: 0, vessels: 0, muscles: 1.0 },
    opacities: { skin: 0, organs: 0, skeleton: 0, vessels: 0, muscles: 1.0 },
  },
  {
    id: "viscera_vessels",
    name: "🫀 A'zolar va Qon aylanishi",
    explode: 0.5,
    layers: { skin: 0, organs: 1.0, skeleton: 0.3, vessels: 1.0, muscles: 0 },
    opacities: { skin: 0, organs: 1.0, skeleton: 0.3, vessels: 1.0, muscles: 0 },
  },
];

export const ORGAN_INFO = {
  heart: {
    name: "Yurak (3D Animatsiyali)",
    shortName: "Yurak",
    system: "Qon-tomir tizimi",
    color: "#e11d48",
    url: heartUrl,
    hasAnimation: true,
    animatedType: "heartbeat",
    desc: "To'rt kamerali kuchli mushak nasosi. Kislorodga to'yingan qonni butun tanaga haydab, metabolizm chiqindilari va karbonat angidridni qaytarib tozalashga yo'naltiradi.",
    summary: "To'rt kamerali kuchli mushak nasosi bo'lib, butun tana bo'ylab uzluksiz qon aylanishini ta'minlaydi.",
    fact: "Inson yuragi bir kunda o'rtacha 100 000 marta, bir yilda 36 million marta uradi. Hayot davomida 2.5 milliarddan ortiq qisqaradi.",
    funFact: "Inson yuragi bir kunda o'rtacha 100 000 marta uradi va 7 500 litrdan ortiq qon haydaydi.",
  },
  lungs: {
    name: "O'pka va Nafas yo'llari",
    shortName: "O'pka",
    system: "Nafas olish tizimi",
    color: "#f43f5e",
    url: lungsUrl,
    hasAnimation: true,
    animatedType: "breathing",
    desc: "Nafas olish tizimining markaziy juft a'zosi. Havodagi kislorodni qonga o'tkazib, qondagi karbonat angidrid gazini tashqariga chiqarish vazifasini bajaradi.",
    summary: "Havodan kislorodni qonga o'tkazuvchi va karbonat angidridni chiqaruvchi asosiy nafas a'zosi.",
    fact: "O'pka alveolalarining umumiy maydoni taxminan 70-100 kvadrat metrni tashkil qiladi - bu tennis korti o'lchamiga teng.",
    funFact: "O'pka alveolalari maydoni 70-100 kv. metrni tashkil qiladi va inson kuniga 11 000 litr havo bilan nafas oladi.",
  },
  brain: {
    name: "Bosh miya va Asab tizimi",
    shortName: "Bosh miya",
    system: "Asab tizimi",
    color: "#a855f7",
    url: neurologyUrl,
    desc: "Tananing oliy boshqaruv va axborot markazi. Sezgi, fikrlash, ixtiyoriy va avtomatik tana harakatlari hamda barcha hayotiy a'zolar faoliyatini muvofiqlashtiradi.",
    summary: "Barcha sezgi, harakat, xotira va hayotiy jarayonlarni muvofiqlashtiruvchi markaziy a'zo.",
    fact: "Bosh miyada taxminan 86 milliard neyron mavjud bo'lib, u tananing umumiy energiyasining 20% ini iste'mol qiladi.",
    funFact: "Bosh miyada 86 milliard neyron bor va u tanadagi umumiy energiyaning 20 foizini iste'mol qiladi.",
  },
  liver: {
    name: "Jigar va O't pufagi",
    shortName: "Jigar",
    system: "Hazm qilish tizimi",
    color: "#b91c1c",
    url: liverUrl,
    desc: "Organizmning eng katta kimyoviy laboratoriyasi. Oziq moddalarni qayta ishlaydi, qonni toksinlardan tozalaydi, yog'larni parchalash uchun o't suyuqligi (safro) ishlab chiqaradi.",
    summary: "Toksinlarni tozalovchi, o't suyuqligi ishlab chiqaruvchi va moddalar almashinuvini boshqaruvchi a'zo.",
    fact: "Jigar o'z to'qimasining 75% qismi olib tashlansa ham bir necha oy ichida dastlabki hajmiga to'liq qayta o'sib yetisha oladi.",
    funFact: "Jigar hatto 75% qismi zararlanganda ham butunlay qayta o'sib tiklana oladigan yagona ichki a'zodir.",
  },
  stomach: {
    name: "Oshqozon va Hazm yo'llari",
    shortName: "Oshqozon",
    system: "Hazm qilish tizimi",
    color: "#ea580c",
    url: digestiveSystemUrl,
    desc: "Qizilo'ngach, oshqozon, ingichka va yo'g'on ichaklardan iborat yaxlit ovqat hazm qilish tizimi. Ozuqa moddalarini parchalaydi va qonga so'radi.",
    summary: "Ovqatni kislota va fermentlar yordamida hazm qiluvchi va oziq moddalarni so'ruvchi tizim.",
    fact: "Oshqozon shirasi tarkibidagi xlorid kislotasi shu darajada kuchliki, oshqozon o'z-o'zini hazm qilib yubormasligi uchun har 3-4 kunda ichki shilliq qavatini yangilab turadi.",
    funFact: "Oshqozon shillig'i kislotadan himoyalanish uchun har bir necha kunda butunlay yangilanadi.",
  },
  kidneys: {
    name: "Buyraklar va Ayirish a'zolari",
    shortName: "Buyraklar",
    system: "Ayirish tizimi",
    color: "#be123c",
    url: kidneyUrl,
    desc: "Loviya shaklidagi juft a'zo. Qonni uzluksiz filtrlaydi, toksinlar va ortiqcha suyuqlikni siydik orqali chiqaradi, arterial qon bosimini nazorat qiladi.",
    summary: "Qonni tinimsiz tozalovchi va tana suyuqliklari muvozanatini saqlovchi filtrlash a'zosi.",
    fact: "Har bir buyrakda taxminan 1 millionta mikroskopik nefronlar joylashgan bo'lib, ular kuniga 180 litr qon plazmasini filtrlaydi.",
    funFact: "Har bir buyrakda 1 milliondan ortiq nefron mavjud bo'lib, ular kuniga 180 litr qonni filtrlaydi.",
  },
  intestines: {
    name: "Ingichka va Yo'g'on ichak",
    shortName: "Ichaklar",
    system: "Hazm qilish tizimi",
    color: "#d97706",
    url: digestiveSystemUrl,
    desc: "Ingichka ichak aminokislotalar, glyukoza va yog'larni so'radi; yo'g'on ichak esa suvni qayta shimib najas hosil qiladi.",
    summary: "Oziq moddalar va suvning so'rilishini amalga oshiruvchi ichak trakti.",
    fact: "Katta yoshli odamning ingichka ichagi uzunligi taxminan 6 metr, yo'g'on ichagi esa 1.5 metrga yetadi.",
    funFact: "Inson ingichka ichagining umumiy ichki yuzasi mikrovorsinkalar tufayli 30 kvadrat metrga yetadi.",
  },
  skeleton: {
    name: "To'liq Inson Skeleti (206 suyak)",
    shortName: "Skelet",
    system: "Tayanch-harakat tizimi",
    color: "#e2e8f0",
    url: skeletonUrl,
    desc: "206 ta suyakdan iborat anatomik tayanch karkasi. Miya, yurak, o'pkani himoyalaydi, mushaklar birikadigan richaglarni hosil qiladi va ilikda qon hujayralarini yaratadi.",
    summary: "Tananing 206 ta suyakdan iborat mustahkam tayanch va himoya tizimi.",
    fact: "Inson son suyagi (femur) tanadagi eng uzun va eng baquvvat suyak bo'lib, beton kabi katta yuklanishga bardosh beradi.",
    funFact: "Son suyagi inson tanasidagi eng baquvvat suyak bo'lib, 1 tonnagacha bo'lgan og'irlikni ko'tara oladi.",
  },
  muscles: {
    name: "To'liq Mushaklar tizimi (Miologiya)",
    shortName: "Mushaklar",
    system: "Tayanch-harakat tizimi",
    color: "#dc2626",
    url: myologyUrl,
    desc: "600 dan ortiq skelet mushaklaridan iborat majmua. Qisqarish orqali barcha tana harakatlarini ta'minlaydi, qomatni saqlaydi va issiqlik ishlab chiqaradi.",
    summary: "Tananing harakati, qomati va tana harorati barqarorligini ta'minlovchi mushaklar.",
    fact: "Chaynov mushagi (masseter) tana yuzasi nisbatida eng kuchli mushak hisoblanib, jag'da 90 kg dan ortiq bosim kuchi hosil qila oladi.",
    funFact: "Chaynov mushagi 90 kg dan ortiq bosim kuchi hosil qila oladigan tanadagi eng kuchli mushakdir.",
  },
  circulatory: {
    name: "Qon-tomir tizimi (Angiologiya)",
    shortName: "Qon-tomir",
    system: "Qon-tomir tizimi",
    color: "#3b82f6",
    url: angiologyUrl,
    desc: "Arteriyalar, venalar va kapillyarlardan iborat yaxlit transport tarmog'i. Kislorod, ozuqa, gormon va immunitet hujayralarini butun tanaga yetkazadi.",
    summary: "Arteriyalar, venalar va kapillyarlardan iborat butun tana qon transport tizimi.",
    fact: "Odam tanasidagi barcha qon tomirlarining umumiy uzunligi taxminan 100 000 km bo'lib, Yer ekvatorini 2.5 marta aylanishga yetadi.",
    funFact: "Barcha qon tomirlarining umumiy uzunligi 100 000 km bo'lib, Yer ekvatorini 2.5 marta o'rashga yetadi.",
  },
  skull: {
    name: "Bosh suyagi (Kalla anatomiyasi)",
    shortName: "Bosh suyagi",
    system: "Skelet tizimi",
    color: "#cbd5e1",
    url: skullUrl,
    desc: "Miya qutisi va yuz skeletini tashkil etuvchi 22 ta suyak birikmasi. Bosh miya va sezgi a'zolarini mustahkam himoya qiladi.",
    summary: "Bosh miya va yuz tuzilmalarini himoya qiluvchi mustahkam suyak majmuasi.",
    fact: "Kalla suyagida pastki jag'dan tashqari barcha suyaklar harakatsiz choklar orqali mahkam birlashgan.",
    funFact: "Kalla suyagining pastki jag'dan boshqa barcha suyaklari qo'zg'almas choklar bilan birlashgan.",
  },
  eye: {
    name: "Ko'z va Ko'z kosasi mushaklari",
    shortName: "Ko'z mushaklari",
    system: "Sezgi a'zolari",
    color: "#06b6d4",
    url: orbitEyeUrl,
    desc: "Ko'z soqqasi va uni turli yo'nalishlarda chaqqon harakatlantiruvchi 6 ta asosiy ko'z mushagi (to'g'ri va qiyshiq mushaklar).",
    summary: "Ko'rish a'zosi va uning 6 ta nozik harakatlanuvchi mushak apparati.",
    fact: "Ko'z mushaklari inson tanasidagi eng chaqqon mushaklar bo'lib, bir kunda 100 000 dan ortiq mikrog'imirlash harakatlarini bajaradi.",
    funFact: "Ko'z mushaklari tanadagi eng tezkor mushaklar bo'lib, soniyaning 1/100 qismida harakatlana oladi.",
  },
  diaphragm: {
    name: "Diafragma mushagi",
    shortName: "Diafragma",
    system: "Nafas olish tizimi",
    color: "#fb7185",
    url: diaphragmUrl,
    desc: "Ko'krak va qorin bo'shlig'i chegarasidagi gumbazsimon asosiy nafas mushagi. Har bir nafasda pastga tushib o'pka hajmini kengaytiradi.",
    summary: "Nafas olishning asosiy harakatlantiruvchi gumbazsimon mushagi.",
    fact: "Diafragma asabining (n. phrenicus) qisqa tutqanoqsimon qo'zg'alishi natijasida hammamizga tanish bo'lgan hiqichoq (singultus) paydo bo'ladi.",
    funFact: "Diafragmaning kutilmagan qisqarishi natijasida insonlarda hiqichoq yuzaga keladi.",
  },
};

export const DEFAULT_VISIBILITY = {
  skin: true,
  muscles: true,
  organs: true,
  vessels: true,
};

export const DEFAULT_SKIN_OPACITY = 0.35;
export const defaultLayerOpacity = (system) => {
  if (system === "skin") return DEFAULT_SKIN_OPACITY;
  if (system === "muscles") return 0.9;
  if (system === "vessels") return 0.95;
  return 1.0;
};

export const SKETCHFAB_STAGES = [
  { id: "start", time: 0, label: "To'liq tana (Teri)", badge: "00:00", desc: "Tashqi teri qoplamasi bilan yaxlit inson qomati." },
  { id: "muscles", time: 9.5, label: "Mushaklar", badge: "00:09", desc: "Teri ajralib, 600 dan ortiq mushak tolalari ko'rinadi." },
  { id: "exploded", time: 22.0, label: "Portlatilgan atlas", badge: "00:22", desc: "A'zolar, 206 ta suyakli skelet va qon tomirlar alohida ajraladi." },
  { id: "organs", time: 33.5, label: "A'zolar & Qon aylanishi", badge: "00:33", desc: "Yurak, o'pka, hazm a'zolari va qon tomirlar tarmog'i." },
  { id: "reassemble", time: 44.0, label: "Qayta yig'ilish", badge: "00:44", desc: "Barcha qismlar qaytadan yaxlit tanaga birlashadi." },
];

export const SKETCHFAB_LAYERS = [
  { id: "skeleton", name: "Skelet (Suyaklar)", short: "Skelet", color: "#e2e8f0" },
  { id: "muscles", name: "Mushaklar tizimi", short: "Mushaklar", color: "#dc2626" },
  { id: "skin", name: "Teri qoplami", short: "Teri", color: "#e8b89b" },
  { id: "circulatory", name: "Qon-tomir tizimi", short: "Qon-tomir", color: "#3b82f6" },
  { id: "heart", name: "Yurak (Cor)", short: "Yurak", color: "#e11d48" },
  { id: "lungs", name: "O'pka (Pulmones)", short: "O'pka", color: "#f43f5e" },
  { id: "brain", name: "Bosh miya (Encephalon)", short: "Bosh miya", color: "#a855f7" },
  { id: "liver", name: "Jigar va O't pufagi", short: "Jigar", color: "#b91c1c" },
  { id: "digestive", name: "Hazm tizimi (Oshqozon)", short: "Hazm", color: "#ea580c" },
  { id: "diaphragm", name: "Diafragma mushagi", short: "Diafragma", color: "#fb7185" },
  { id: "eyes", name: "Ko'zlar (Oculi)", short: "Ko'zlar", color: "#06b6d4" },
];

export const ORGAN_TIMESTAMPS = {
  heart: 24.0,
  lungs: 22.0,
  brain: 22.0,
  liver: 22.0,
  stomach: 22.0,
  digestive: 22.0,
  kidneys: 22.0,
  intestines: 22.0,
  skeleton: 20.0,
  muscles: 9.5,
  circulatory: 24.0,
  diaphragm: 22.0,
  eyes: 22.0,
  skull: 20.0,
};

export const DISCLAIMER = "SmartLab Interaktiv 3D Anatomiya Simulyatori ta'limiy maqsadlar uchun ishlab chiqilgan.";

