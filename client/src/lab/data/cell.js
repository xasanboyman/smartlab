// Animal cell organelles for the biology cell viewer.
// Real eukaryotic cell organelles mapped to the 3D Sketchfab model.

export const ORGANELLES = [
  {
    id: "nucleus",
    name: "Yadro va Yadrocha",
    color: "#8b5cf6",
    pos: [0, 0, 0],
    size: 0.9,
    about:
      "Hujayraning boshqaruv markazi va irsiy axborot (DNK) xazinasi. Yadrocha esa ribosomalar sintez qilinadigan asosiy joy hisoblanadi.",
  },
  {
    id: "mitochondria",
    name: "Mitoxondriya",
    color: "#ef4444",
    pos: [1.6, 0.6, 0.4],
    size: 0.45,
    about:
      "Hujayraning 'energiya stansiyasi'. Oziq moddalarni parchalab, ATF (adenozintrifosfat) ko'rinishida universal hujayra energiyasini hosil qiladi.",
  },
  {
    id: "golgi",
    name: "Goldji apparati",
    color: "#f97316",
    pos: [1.3, -1.1, -0.3],
    size: 0.5,
    about:
      "Yassilangan sisternalar to'plami. Endoplazmatik to'rdan kelgan oqsillar va lipidlarni kimyoviy o'zgartiradi, qadoqlaydi va kerakli joylarga yo'naltiradi.",
  },
  {
    id: "rough_er",
    name: "Donador Endoplazmatik To'r",
    color: "#ec4899",
    pos: [0.5, 0.8, -0.6],
    size: 0.55,
    about:
      "Membranasida ko'p sonli ribosomalar joylashgan tarmoq. Hujayradan tashqariga chiqariladigan yoki membranaga birikadigan oqsillarni sintezlaydi.",
  },
  {
    id: "smooth_er",
    name: "Silliq Endoplazmatik To'r",
    color: "#06b6d4",
    pos: [-0.6, -0.7, -0.7],
    size: 0.5,
    about:
      "Ribosomasiz kanallar tizimi. Lipidlar va fosfolipidlarni sintez qiladi, zaharli moddalarni zararsizlantiradi va kalsiy ionlarini saqlaydi.",
  },
  {
    id: "centriole",
    name: "Sentriola (Hujayra markazi)",
    color: "#f59e0b",
    pos: [0.8, 1.2, 0.2],
    size: 0.35,
    about:
      "Silindrsimon mikronaychalar to'plami. Hujayra bo'linishida (mitoz va meyoz) bo'linish urchug'ini hosil qiladi.",
  },
  {
    id: "microtubule",
    name: "Mikronaychalar (Sitokarkas)",
    color: "#38bdf8",
    pos: [0, 0, 0],
    size: 0.3,
    about:
      "Tubulin oqsilidan tuzilgan elastik naychalar. Hujayraga shakl beradi, ichki organoidlar transporti uchun 'temir yo'l' vazifasini o'taydi.",
  },
  {
    id: "peroxisome",
    name: "Peroksisoma",
    color: "#10b981",
    pos: [-1.4, 0.5, 0.5],
    size: 0.3,
    about:
      "Vodorod peroksidini parchalovchi katalaza fermentini saqlaydi. Yog' kislotalarini oksidlab zararsizlantiradi.",
  },
  {
    id: "vesicles",
    name: "Vezikulalar (Pufakchalar)",
    color: "#a855f7",
    pos: [1.5, -0.3, 0.8],
    size: 0.25,
    about:
      "Moddalarni hujayra bo'ylab tashuvchi va ekzositoz/endositozda qatnashuvchi kichik membranali pufakchalar.",
  },
  {
    id: "membrane",
    name: "Plazmatik Membrana",
    color: "#60a5fa",
    pos: [0, 0, 0],
    size: 1.0,
    about:
      "Fosfolipid bilipid qavati va oqsillardan tuzilgan yarim o'tkazuvchan tashqi to'siq. Hujayraning ichki muhitini barqaror saqlaydi.",
  },
];

export const getOrganelle = (id) =>
  ORGANELLES.find((o) => o.id === id) || null;

export const CELL_MODELS = [
  {
    id: "eukaryotic-cell",
    name: "Eukariot hujayra · 3D (Batafsil)",
    modelUrl: "/models/eukaryotic-cell.glb",
    about:
      "Sketchfab yuqori aniqlikdagi eukariot hujayra 3D modeli. Yadro, mitoxondriya, Goldji apparati, endoplazmatik to'r, sentriolalar va sitokarkas mikronaychalarining 3D tuzilishini bevosita Three.js WebGL orqali interaktiv aylantirib o'rganing.",
  },
];

export const getCellModel = (id) => CELL_MODELS.find((m) => m.id === id) || null;
