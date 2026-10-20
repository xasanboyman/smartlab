// Uzbek (Latin) element names. Descriptions (history/uses/hazards) fall back to the ru locale
// in langController, which deep-merges this file over ru_elements.
const NAMES = [
  "Vodorod", "Geliy", "Litiy", "Berilliy", "Bor", "Uglerod", "Azot", "Kislorod", "Ftor", "Neon",
  "Natriy", "Magniy", "Alyuminiy", "Kremniy", "Fosfor", "Oltingugurt", "Xlor", "Argon", "Kaliy", "Kalsiy",
  "Skandiy", "Titan", "Vanadiy", "Xrom", "Marganes", "Temir", "Kobalt", "Nikel", "Mis", "Rux",
  "Galliy", "Germaniy", "Mishyak", "Selen", "Brom", "Kripton", "Rubidiy", "Stronsiy", "Ittriy", "Sirkoniy",
  "Niobiy", "Molibden", "Texnetsiy", "Ruteniy", "Rodiy", "Palladiy", "Kumush", "Kadmiy", "Indiy", "Qalay",
  "Surma", "Tellur", "Yod", "Ksenon", "Seziy", "Bariy", "Lantan", "Seriy", "Prazeodim", "Neodim",
  "Prometiy", "Samariy", "Yevropiy", "Gadoliniy", "Terbiy", "Disproziy", "Golmiy", "Erbiy", "Tuliy", "Itterbiy",
  "Lyutetsiy", "Gafniy", "Tantal", "Volfram", "Reniy", "Osmiy", "Iridiy", "Platina", "Oltin", "Simob",
  "Talliy", "Qo'rg'oshin", "Vismut", "Poloniy", "Astat", "Radon", "Fransiy", "Radiy", "Aktiniy", "Toriy",
  "Protaktiniy", "Uran", "Neptuniy", "Plutoniy", "Ameritsiy", "Kyuriy", "Berkliy", "Kaliforniy", "Eynshteyniy", "Fermiy",
  "Mendeleviy", "Nobeliy", "Lourensiy", "Rezerfordiy", "Dubniy", "Siborgiy", "Boriy", "Xassiy", "Meytneriy", "Darmshtadtiy",
  "Rentgeniy", "Koperniksiy", "Nihoniy", "Fleroviy", "Moskoviy", "Livermoriy", "Tennessin", "Oganeson",
];

export const uz_elements = Object.fromEntries(NAMES.map((name, i) => [String(i + 1), { name }]));
