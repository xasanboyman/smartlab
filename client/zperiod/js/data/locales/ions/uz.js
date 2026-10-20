// =============================================================================
// Uzbek (Latin) ion locale data for SmartLab 3D / Zperiod
// Fully localized Level 1-4 data for all 43 ions
// =============================================================================

export const uz_ions = {
  h_plus: {
    name: "Vodorod ioni",
    headlineName: "Vodorod (Proton)",
    customData: {
      level1: {
        type: "Kation / Kislota asosi",
        source: "Kislotalar (HCl, H₂SO₄) – 1 e⁻ yo'qotishi",
        phase: "Suvli eritma (aq, H₃O⁺ ko'rinishida) – rangsiz",
        valence: "0 (bo'sh qatlam)",
        keyCompounds: [
          { formula: "HCl", name: "Oshqozon shirasi xlorid kislotasi" },
          { formula: "H₂SO₄", name: "Akkumulyator sulfat kislotasi" },
        ],
      },
      level2: {
        molarMass: "1.008 g/mol",
        subatomic: "1 p⁺ | 0 e⁻",
        statusBanner: "Kislotalilik o'lchovi (pH asosi)",
        slotA: { label: "Lakmus qog'ozi", result: "Qizaradi", desc: "Ko'k lakmusni qizil rangga bo'yaydi" },
        slotB: { label: "Reaksion faollik", result: "Shiddatli", desc: "Karbonatlar bilan CO₂ ajratadi" },
      },
      level3: {
        config: "[1s]⁰ (Bo'sh)",
        oxidation: "+1",
        ionicRadius: "~0.84 fm (Yalang'och yadro)",
        hydrationEnthalpy: "-1091 kJ/mol (Juda yuqori)",
        coordination: "1 (Bo'sh juftlik bilan gidroksoniy hosil qiladi)",
      },
      level4: {
        discoveryYear: "1884-yil",
        discoveredBy: "Svante Arrenius",
        namedBy: "Yunoncha Hydro (Suv) + Genes (Hosildor)",
        stse: ["Okean kislotalanishi (marjonlarga ta'sir)", "Kislotali yomg'irlar (o'rmonlarga zarar)"],
        commonUses: ["Oshqozon hazm qilish jarayoni", "Kimyoviy batareyalar va elektrolitlar"],
        hazards: ["Korroziyali (kimyoviy kuyish chaqiradi)"],
      },
    },
  },

  li_plus: {
    name: "Litiy ioni",
    headlineName: "Litiy kationi",
    customData: {
      level1: {
        type: "Ishqoriy metall kationi",
        source: "1-guruh elementi – 1 e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (geliy qobig'i: 1s²)",
        keyCompounds: [
          { formula: "LiCl", name: "Litiy xlorid" },
          { formula: "Li₂CO₃", name: "Kayfiyat stabilizatori / tibbiyot" },
        ],
      },
      level2: {
        molarMass: "6.94 g/mol",
        subatomic: "3 p⁺ | 2 e⁻",
        statusBanner: "Yengil akkumulyator kationi",
        slotA: { label: "Olov testi", result: "To'q qizil", desc: "Olovni yorqin qirmizi rangga bo'yaydi" },
        slotB: { label: "Zaryad zichligi", result: "Juda yuqori", desc: "Kichik radiusli kuchli polyarizator" },
      },
      level3: {
        config: "[He] 1s²",
        oxidation: "+1",
        ionicRadius: "76 pm",
        hydrationEnthalpy: "-519 kJ/mol",
        coordination: "4 (Tetraedrik gidratatsiya)",
      },
      level4: {
        discoveryYear: "1817-yil",
        discoveredBy: "Yohan Avgust Arfvedson",
        namedBy: "Yunoncha Lithos (Tosh)",
        stse: ["Litiy-ionli akkumulyatorlar (yashil energiya)", "Psixiatrik dori vositalari"],
        commonUses: ["Smartfon va elektromobil batareyalari", "Seramika va maxsus shishalar"],
        hazards: ["Yuqori dozada neyrotoksik"],
      },
    },
  },

  na_plus: {
    name: "Natriy ioni",
    headlineName: "Natriy kationi",
    customData: {
      level1: {
        type: "Ishqoriy metall kationi",
        source: "1-guruh elementi – 1 e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (neon qobig'i: 2s² 2p⁶)",
        keyCompounds: [
          { formula: "NaCl", name: "Osh tuzi / Fiziologik eritma" },
          { formula: "NaHCO₃", name: "Osh sodasi" },
          { formula: "NaOH", name: "O'yuvchi natriy (kaustik)" },
        ],
      },
      level2: {
        molarMass: "22.99 g/mol",
        subatomic: "11 p⁺ | 10 e⁻",
        statusBanner: "Hujayradan tashqari asosiy elektrolit",
        slotA: { label: "Olov testi", result: "Sariq olov", desc: "Olovni intensiv yorqin sariqqa bo'yaydi" },
        slotB: { label: "Eruvchanlik", result: "Barchasi eruvchan", desc: "Deyarli barcha tuzlari suvda eriydi" },
      },
      level3: {
        config: "[Ne] 2s² 2p⁶",
        oxidation: "+1",
        ionicRadius: "102 pm",
        hydrationEnthalpy: "-406 kJ/mol",
        coordination: "6 (Oktaedrik)",
      },
      level4: {
        discoveryYear: "1807-yil",
        discoveredBy: "Hamfri Devi",
        namedBy: "Arabcha Natrun (soda)",
        stse: ["Asab impulslari o'tkazuvchanligi", "Gipertoniya xavfi (ortiqcha osh tuzi)"],
        commonUses: ["Oziq-ovqat sanoati", "Qon bosimi regulyatsiyasi"],
        hazards: ["Gipernatriyemiya (organizmda suv ushlanib qolishi)"],
      },
    },
  },

  k_plus: {
    name: "Kaliy ioni",
    headlineName: "Kaliy kationi",
    customData: {
      level1: {
        type: "Ishqoriy metall kationi",
        source: "1-guruh elementi – 1 e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (argon qobig'i: 3s² 3p⁶)",
        keyCompounds: [
          { formula: "KCl", name: "Kaliy xlorid / o'g'it" },
          { formula: "KNO₃", name: "Kaliy selitrasi" },
          { formula: "KMnO₄", name: "Margansovka" },
        ],
      },
      level2: {
        molarMass: "39.10 g/mol",
        subatomic: "19 p⁺ | 18 e⁻",
        statusBanner: "Hujayra ichidagi asosiy bio-kation",
        slotA: { label: "Olov testi", result: "Binafsharang", desc: "Kobalt shishasi orqali binafsha olov" },
        slotB: { label: "Natriy-kaliy nasosi", result: "Faol transport", desc: "Yurak ritmini ta'minlaydi" },
      },
      level3: {
        config: "[Ar] 3s² 3p⁶",
        oxidation: "+1",
        ionicRadius: "138 pm",
        hydrationEnthalpy: "-322 kJ/mol",
        coordination: "6-8",
      },
      level4: {
        discoveryYear: "1807-yil",
        discoveredBy: "Hamfri Devi",
        namedBy: "Arabcha Al-qalyah (kul)",
        stse: ["O'simliklar o'sishi va hosildorlik", "Yurak qisqarish ritmi"],
        commonUses: ["Qishloq xo'jaligi kaliyli o'g'itlari", "Tibbiyot (aritmiyaga qarshi)"],
        hazards: ["Giperkaliyemiya (yurak to'xtash xavfi)"],
      },
    },
  },

  ag_plus: {
    name: "Kumush ioni",
    headlineName: "Kumush kationi",
    customData: {
      level1: {
        type: "Og'ir metall kationi",
        source: "11-guruh o'tish metalli – 1 e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "To'liq d¹⁰ qobig'i",
        keyCompounds: [
          { formula: "AgNO₃", name: "Lyapis (kumush nitrat)" },
          { formula: "AgCl", name: "Yorug'likka sezgir oq cho'kma" },
        ],
      },
      level2: {
        molarMass: "107.87 g/mol",
        subatomic: "47 p⁺ | 46 e⁻",
        statusBanner: "Antibakterial va tahliliy kation",
        slotA: { label: "Sifat reaksiyasi", result: "Oq tvorogsimon", desc: "Xloridlar bilan AgCl cho'kmasi tushadi" },
        slotB: { label: "Fotosezgirlik", result: "Qorayadi", desc: "Yorug'lik ta'sirida erkin Ag ajralib qorayadi" },
      },
      level3: {
        config: "[Kr] 4d¹⁰",
        oxidation: "+1",
        ionicRadius: "115 pm",
        hydrationEnthalpy: "-473 kJ/mol",
        coordination: "2-4 (Chiziqli va tetraedr)",
      },
      level4: {
        discoveryYear: "Qadim zamonlardan ma'lum",
        discoveredBy: "Qadimgi metallurglar",
        namedBy: "Lotincha Argentum (yorqin, oq)",
        stse: ["Klassik fotografiya emulsiyasi", "Bakteriyalarga qarshi kumush suvi"],
        commonUses: ["Antiseptik tibbiy vositalar", "Galvanika va zargarlik"],
        hazards: ["Argiriya (terining qaytmas ko'karishi)"],
      },
    },
  },

  mg_2plus: {
    name: "Magniy ioni",
    headlineName: "Magniy kationi",
    customData: {
      level1: {
        type: "Ishqoriy-yer metall kationi",
        source: "2-guruh elementi – 2 ta e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (neon qobig'i: 2s² 2p⁶)",
        keyCompounds: [
          { formula: "MgO", name: "Magniy oksidi / o'tga chidamli" },
          { formula: "MgSO₄", name: "Epsom tuzi (ingliz tuzi)" },
          { formula: "Mg(OH)₂", name: "Magniy suti (antatsid)" },
        ],
      },
      level2: {
        molarMass: "24.31 g/mol",
        subatomic: "12 p⁺ | 10 e⁻",
        statusBanner: "Xlorofill markaziy atomi",
        slotA: { label: "Cho'kma testi", result: "Oq cho'kma", desc: "Ishqor qo'shilganda Mg(OH)₂ tushadi" },
        slotB: { label: "Biologik rol", result: "Fermentlar faoli", desc: "300 dan ortiq bio-ferment faollashtiruvchisi" },
      },
      level3: {
        config: "[Ne] 2s² 2p⁶",
        oxidation: "+2",
        ionicRadius: "72 pm (Neytral atomdan 55% kichik)",
        hydrationEnthalpy: "-1921 kJ/mol (Katta zaryad zichligi)",
        coordination: "6 (Mustahkam oktaedr)",
      },
      level4: {
        discoveryYear: "1755-yil",
        discoveredBy: "Jozef Blek",
        namedBy: "Gretsiyadagi Magnesiya viloyati",
        stse: ["Fotosintez va o'simlik yashilligi", "Suvning doimiy qattiqligi"],
        commonUses: ["Xlorofill molekulasi o'zagi", "Mushak spazmlariga qarshi dorilar"],
        hazards: ["Ortiqcha doza ich surishiga sabab bo'ladi"],
      },
    },
  },

  ca_2plus: {
    name: "Kalsiy ioni",
    headlineName: "Kalsiy kationi",
    customData: {
      level1: {
        type: "Ishqoriy-yer metall kationi",
        source: "2-guruh elementi – 2 ta e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (argon qobig'i: 3s² 3p⁶)",
        keyCompounds: [
          { formula: "CaCO₃", name: "Ohaktosh, bo'r, marmar" },
          { formula: "CaSO₄·2H₂O", name: "Gips" },
          { formula: "CaCl₂", name: "Muz erituvchi tuz" },
        ],
      },
      level2: {
        molarMass: "40.08 g/mol",
        subatomic: "20 p⁺ | 18 e⁻",
        statusBanner: "Suyak va tishlarning asosiy karkasi",
        slotA: { label: "Olov testi", result: "G'isht-qizil", desc: "Olovni g'isht qizil rangga bo'yaydi" },
        slotB: { label: "Cho'kma", result: "CaCO₃ oq", desc: "CO₂ o'tkazilganda ohakli suv loyqalanadi" },
      },
      level3: {
        config: "[Ar] 3s² 3p⁶",
        oxidation: "+2",
        ionicRadius: "100 pm",
        hydrationEnthalpy: "-1577 kJ/mol",
        coordination: "6-8",
      },
      level4: {
        discoveryYear: "1808-yil",
        discoveredBy: "Hamfri Devi",
        namedBy: "Lotincha Calx (ohak)",
        stse: ["Suyak to'qimasi mineralizatsiyasi", "Qon ivish kaskadi"],
        commonUses: ["Qurilish (sement, ohak)", "Suyak mustahkamlovchi vitaminlar"],
        hazards: ["Buyrak toshlari paydo bo'lish xavfi"],
      },
    },
  },

  ba_2plus: {
    name: "Bariy ioni",
    headlineName: "Bariy kationi",
    customData: {
      level1: {
        type: "Og'ir ishqoriy-yer metall kationi",
        source: "6-davr 2-guruh elementi – 2 ta e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (ksenon qobig'i)",
        keyCompounds: [
          { formula: "BaSO₄", name: "Rentgen kontrast moddasi" },
          { formula: "BaCl₂", name: "Sulfat ionini aniqlovchi reaktiv" },
        ],
      },
      level2: {
        molarMass: "137.33 g/mol",
        subatomic: "56 p⁺ | 54 e⁻",
        statusBanner: "Sulfatlarning tahliliy reaktivi",
        slotA: { label: "Olov testi", result: "Och yashil", desc: "Olovni och yashil rangga bo'yaydi" },
        slotB: { label: "Cho'kma", result: "BaSO₄ oq", desc: "SO₄²⁻ bilan kislotada erimaydigan cho'kma" },
      },
      level3: {
        config: "[Xe] 5s² 5p⁶",
        oxidation: "+2",
        ionicRadius: "135 pm",
        hydrationEnthalpy: "-1305 kJ/mol",
        coordination: "8",
      },
      level4: {
        discoveryYear: "1774-yil",
        discoveredBy: "Karl Vilgelm Sheele",
        namedBy: "Yunoncha Barys (og'ir)",
        stse: ["Oshqozon-ichak rentgenografiyasi", "Pirotexnika yashil olovlari"],
        commonUses: ["Tibbiy diagnostika", "Bo'yoqlar va qog'oz sanoati"],
        hazards: ["Eruvchan tuzlari kuchli zaharli!"],
      },
    },
  },

  zn_2plus: {
    name: "Rux ioni",
    headlineName: "Rux kationi",
    customData: {
      level1: {
        type: "Amfoter o'tish metalli kationi",
        source: "12-guruh elementi – 2 ta e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "To'liq d¹⁰ qobig'i",
        keyCompounds: [
          { formula: "ZnO", name: "Rux oq bo'yog'i / malham" },
          { formula: "ZnSO₄", name: "Rux kuporosi" },
        ],
      },
      level2: {
        molarMass: "65.38 g/mol",
        subatomic: "30 p⁺ | 28 e⁻",
        statusBanner: "Immun tizimi va fermentlar faollashtiruvchisi",
        slotA: { label: "Amfoterlik", result: "Eriydi", desc: "Ishqor ortiqchasida tetragidroksosinkat beradi" },
        slotB: { label: "Sulfid cho'kmasi", result: "ZnS oq", desc: "Yagona oq rangli metall sulfidi" },
      },
      level3: {
        config: "[Ar] 3d¹⁰",
        oxidation: "+2",
        ionicRadius: "74 pm",
        hydrationEnthalpy: "-2046 kJ/mol",
        coordination: "4-6 (Tetraedr)",
      },
      level4: {
        discoveryYear: "1746-yil",
        discoveredBy: "Andreas Marggraf",
        namedBy: "Nemischa Zinke (tish/nayza)",
        stse: ["Metallarni korroziyadan himoyalash (ruxlash)", "DNK polimeraza fermenti o'zagi"],
        commonUses: ["Galvanik qoplamalar", "Immun tabletkalari"],
        hazards: ["Yuqori miqdorda oshqozonni zararlaydi"],
      },
    },
  },

  al_3plus: {
    name: "Alyuminiy ioni",
    headlineName: "Alyuminiy kationi",
    customData: {
      level1: {
        type: "Amfoter kation",
        source: "13-guruh elementi – 3 ta e⁻ yo'qotishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "0 (neon qobig'i)",
        keyCompounds: [
          { formula: "Al₂O₃", name: "Glinozyom / Yoqut, sapfir" },
          { formula: "AlCl₃", name: "Fridel-Krafts katalizatori" },
          { formula: "KAl(SO₄)₂·12H₂O", name: "Achchiqtosh (kvassiy)" },
        ],
      },
      level2: {
        molarMass: "26.98 g/mol",
        subatomic: "13 p⁺ | 10 e⁻",
        statusBanner: "Amfoter kation (kislota va ishqorda eriydi)",
        slotA: { label: "Amfoterlik", result: "Eriydi", desc: "Ishqor ortiqchasida [Al(OH)₄]⁻ hosil qiladi" },
        slotB: { label: "Gidroliz", result: "Kislotali pH", desc: "Kuchli gidrolizlanib kislotali muhit beradi" },
      },
      level3: {
        config: "[Ne] 2s² 2p⁶",
        oxidation: "+3",
        ionicRadius: "53 pm (O'ta ixcham)",
        hydrationEnthalpy: "-4665 kJ/mol (O'ta kuchli)",
        coordination: "6 ([Al(H₂O)₆]³⁺)",
      },
      level4: {
        discoveryYear: "1825-yil",
        discoveredBy: "Hans Kristian Ersted",
        namedBy: "Lotincha Alumen (achchiqtosh)",
        stse: ["Suv tozalash (koagulyatsiya)", "Tuproq kislotaliligining toksikligi"],
        commonUses: ["Ichimlik suvini tindirish", "Antiperspirantlar"],
        hazards: ["Kislotali tuproqlarda o'simlik ildizini zararlaydi"],
      },
    },
  },

  f_minus: {
    name: "Ftorid ioni",
    headlineName: "Ftorid anioni",
    customData: {
      level1: {
        type: "Galogenid anioni",
        source: "17-guruh – 1 e⁻ biriktirishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "8 (neon okteti)",
        keyCompounds: [
          { formula: "NaF", name: "Tish pastasidagi natriy ftorid" },
          { formula: "CaF₂", name: "Flyuorit minerali" },
        ],
      },
      level2: {
        molarMass: "19.00 g/mol",
        subatomic: "9 p⁺ | 10 e⁻",
        statusBanner: "Tish emalini himoyalovchi anion",
        slotA: { label: "Ca²⁺ bilan", result: "Erimaydi", desc: "CaF₂ erimaydigan mustahkam mineral" },
        slotB: { label: "Shisha bilan", result: "HF o'yadi", desc: "HF kislotasi shishani yemiradi" },
      },
      level3: {
        config: "[Ne] 2s² 2p⁶",
        oxidation: "-1",
        ionicRadius: "133 pm",
        hydrationEnthalpy: "-506 kJ/mol",
        coordination: "6",
      },
      level4: {
        discoveryYear: "1886-yil",
        discoveredBy: "Anri Muassan",
        namedBy: "Lotincha Fluere (oqmoq)",
        stse: ["Ichimlik suvini ftorlash", "Tish kariyesining oldini olish"],
        commonUses: ["Tish pastalari", "Teflon ishlab chiqarish"],
        hazards: ["Yuqori konsentratsiyasi flyuoroz chaqiradi"],
      },
    },
  },

  cl_minus: {
    name: "Xlorid ioni",
    headlineName: "Xlorid anioni",
    customData: {
      level1: {
        type: "Galogenid anioni",
        source: "17-guruh elementi – 1 e⁻ biriktirishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "8 (to'liq barqaror argon okteti)",
        keyCompounds: [
          { formula: "NaCl", name: "Osh tuzi" },
          { formula: "KCl", name: "Sylvinite" },
          { formula: "HCl", name: "Tuz kislotasi" },
        ],
      },
      level2: {
        molarMass: "35.45 g/mol",
        subatomic: "17 p⁺ | 18 e⁻",
        statusBanner: "Hujayra tashqarisidagi asosiy anion",
        slotA: { label: "Sifat reaksiyasi", result: "AgCl oq cho'kma", desc: "Ag⁺ bilan erimaydigan tvorogsimon cho'kma" },
        slotB: { label: "Kislotaga chidamlilik", result: "Erimaydi", desc: "HNO₃ da erimaydi, ammiakda eriydi" },
      },
      level3: {
        config: "[Ar] 3s² 3p⁶",
        oxidation: "-1",
        ionicRadius: "181 pm (Atomidan 80% yirikroq)",
        hydrationEnthalpy: "-381 kJ/mol",
        coordination: "6",
      },
      level4: {
        discoveryYear: "1774-yil",
        discoveredBy: "Karl Vilgelm Sheele",
        namedBy: "Yunoncha Chloros (Och yashil)",
        stse: ["Dengiz suvi sho'rligi (35 g/l)", "Oshqozon shirasining xlorid muvozanati"],
        commonUses: ["Osh tuzi, xlorlash", "Farmatsevtika"],
        hazards: ["O'ta yuqori miqdori qon bosimini oshiradi"],
      },
    },
  },

  br_minus: {
    name: "Bromid ioni",
    headlineName: "Bromid anioni",
    customData: {
      level1: {
        type: "Galogenid anioni",
        source: "17-guruh – 1 e⁻ biriktirishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "8 (kripton okteti)",
        keyCompounds: [
          { formula: "NaBr", name: "Natriy bromid" },
          { formula: "AgBr", name: "Fotografiya emulsiyasi" },
        ],
      },
      level2: {
        molarMass: "79.90 g/mol",
        subatomic: "35 p⁺ | 36 e⁻",
        statusBanner: "Fotografiya va tinchlantiruvchi vositalar",
        slotA: { label: "Sifat reaksiyasi", result: "Sarg'ish cho'kma", desc: "Ag⁺ bilan och sarg'ish AgBr cho'kmasi" },
        slotB: { label: "Oksidlanish", result: "Jigarrang Br₂", desc: "Xlor gazi ta'sirida erkin Br₂ ajraladi" },
      },
      level3: {
        config: "[Kr] 4s² 4p⁶",
        oxidation: "-1",
        ionicRadius: "196 pm",
        hydrationEnthalpy: "-347 kJ/mol",
        coordination: "6",
      },
      level4: {
        discoveryYear: "1826-yil",
        discoveredBy: "Antuan Jerom Balar",
        namedBy: "Yunoncha Bromos (badbo'y)",
        stse: ["Klassik analog fotografiya", "Tinchlantiruvchi tibbiyot preparatlari"],
        commonUses: ["Fotoplyonka", "Yong'inga qarshi antipirenlar"],
        hazards: ["Surunkali qabul qilish bromizm keltirib chiqaradi"],
      },
    },
  },

  i_minus: {
    name: "Yodid ioni",
    headlineName: "Yodid anioni",
    customData: {
      level1: {
        type: "Galogenid anioni",
        source: "17-guruh – 1 e⁻ biriktirishi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "8 (ksenon okteti)",
        keyCompounds: [
          { formula: "KI", name: "Kaliy yodid / antizob" },
          { formula: "AgI", name: "Sun'iy yomg'ir chaqiruvchi" },
        ],
      },
      level2: {
        molarMass: "126.90 g/mol",
        subatomic: "53 p⁺ | 54 e⁻",
        statusBanner: "Qalqonsimon bez gormonlari asosi",
        slotA: { label: "Sifat reaksiyasi", result: "Sariq cho'kma", desc: "Ag⁺ bilan yorqin sariq AgI cho'kmasi" },
        slotB: { label: "Kraxmal testi", result: "Ko'k rang", desc: "Oksidlanganda kraxmalni to'q ko'k rangga bo'yaydi" },
      },
      level3: {
        config: "[Xe] 5s² 5p⁶",
        oxidation: "-1",
        ionicRadius: "220 pm",
        hydrationEnthalpy: "-305 kJ/mol",
        coordination: "6",
      },
      level4: {
        discoveryYear: "1811-yil",
        discoveredBy: "Bernar Kurtua",
        namedBy: "Yunoncha Iodes (binafsharang)",
        stse: ["Zob kasalligining oldini olish", "Bulutlarni ekish (sun'iy yog'in)"],
        commonUses: ["Yodlangan osh tuzi", "Rentgen-kontrast moddalar"],
        hazards: ["Radioaktiv yod-131 dan qalqonsimon bezni himoya qilishda KI ichiladi"],
      },
    },
  },

  o_2minus: {
    name: "Oksid ioni",
    headlineName: "Oksid anioni",
    customData: {
      level1: {
        type: "Xalkogenid anioni",
        source: "Kislorodning 2 ta e⁻ biriktirishi",
        phase: "Qattiq kristall panjara",
        valence: "8 (neon okteti)",
        keyCompounds: [
          { formula: "CaO", name: "So'ndirilmagan ohak" },
          { formula: "Fe₂O₃", name: "Zang / temir rudasi" },
        ],
      },
      level2: {
        molarMass: "16.00 g/mol",
        subatomic: "8 p⁺ | 10 e⁻",
        statusBanner: "Yer qobig'idagi eng ko'p tarqalgan anion",
        slotA: { label: "Suv bilan", result: "OH⁻ hosil qiladi", desc: "O²⁻ + H₂O → 2OH⁻ (suvda mustaqil yashay olmaydi)" },
        slotB: { label: "Bog' mustahkamligi", result: "Yuqori energiya", desc: "Kuchli ionli kristall panjara beradi" },
      },
      level3: {
        config: "[Ne] 2s² 2p⁶",
        oxidation: "-2",
        ionicRadius: "140 pm",
        hydrationEnthalpy: "O'ta yuqori (gidrolizlanadi)",
        coordination: "Kristallga bog'liq",
      },
      level4: {
        discoveryYear: "1774-yil",
        discoveredBy: "Jozef Pristli",
        namedBy: "Lotincha Oxygenium (kislota hosil qiluvchi)",
        stse: ["Yer qobig'i minerallarining 90% oksidlardan iborat", "Metallurgiya va po'lat eritish"],
        commonUses: ["Metallurgiya", "Seramika va sement"],
        hazards: ["Kuchli ishqoriy gidroliz"],
      },
    },
  },

  s_2minus: {
    name: "Sulfid ioni",
    headlineName: "Sulfid anioni",
    customData: {
      level1: {
        type: "Xalkogenid anioni",
        source: "Oltingugurtning 2 ta e⁻ biriktirishi",
        phase: "Suvli eritma va minerallar",
        valence: "8 (argon okteti)",
        keyCompounds: [
          { formula: "FeS", name: "Pirit / temir sulfidi" },
          { formula: "H₂S", name: "Badbo'y vodorod sulfid gazi" },
        ],
      },
      level2: {
        molarMass: "32.06 g/mol",
        subatomic: "16 p⁺ | 18 e⁻",
        statusBanner: "Metallurgiya va rangli cho'kmalar",
        slotA: { label: "Og'ir metallar", result: "Rangli cho'kma", desc: "PbS (qora), CdS (sariq), Sb₂S₃ (to'q sariq)" },
        slotB: { label: "Hidi", result: "Sasigan tuxum", desc: "Kislotada eriganda o'tkir hidli H₂S ajraladi" },
      },
      level3: {
        config: "[Ar] 3s² 3p⁶",
        oxidation: "-2",
        ionicRadius: "184 pm",
        hydrationEnthalpy: "-1305 kJ/mol",
        coordination: "6",
      },
      level4: {
        discoveryYear: "Qadim zamonlardan ma'lum",
        discoveredBy: "Qadimgi konchilar",
        namedBy: "Oltingugurt",
        stse: ["Vulqon gazlari va gidrotermal manbalar", "Rangli metallurgiya rudalari"],
        commonUses: ["Polimetall rudalarni boyitish", "Yarimo'tkazgichlar"],
        hazards: ["H₂S gazi o'ta zaharli (asab falajlovchi)"],
      },
    },
  },

  so4_2minus: {
    name: "Sulfat ioni",
    headlineName: "Sulfat anioni",
    customData: {
      level1: {
        type: "Ko'p atomli oksikislota anioni",
        source: "Sulfat kislotaning to'liq dissotsiatsiyasi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "Rezonans barqaror 3D tetraedr",
        keyCompounds: [
          { formula: "H₂SO₄", name: "Sulfat kislota" },
          { formula: "BaSO₄", name: "Bariy sulfat / rentgen kontrast" },
          { formula: "CuSO₄·5H₂O", name: "Mis kuporosi" },
        ],
      },
      level2: {
        molarMass: "96.06 g/mol",
        subatomic: "1 S + 4 O | 50 e⁻",
        statusBanner: "Kuchsiz ishqoriy barqaror anion",
        slotA: { label: "Sifat reaksiyasi", result: "BaSO₄ oq", desc: "Ba²⁺ bilan kislotalarda mutlaqo erimaydigan cho'kma" },
        slotB: { label: "Geometriya", result: "Tetraedrik", desc: "Sp³ gibridlangan 109.5° burchaklar" },
      },
      level3: {
        config: "Rezonans qobig'i (S-O bog' tartibi ~1.5)",
        oxidation: "S: +6, O: -2",
        ionicRadius: "240 pm (Katta molekulyar radius)",
        hydrationEnthalpy: "-1059 kJ/mol",
        coordination: "Tetraedr",
      },
      level4: {
        discoveryYear: "Qadim zamonlardan ma'lum",
        discoveredBy: "Alkimyogarlar",
        namedBy: "Lotincha Sulphur (oltingugurt)",
        stse: ["Sulfatli mineral o'g'itlar", "Rentgenografiya tekshiruvlari"],
        commonUses: ["Qishloq xo'jaligi, o'g'itlar", "Akkumulyator sanoati"],
        hazards: ["Og'ir metall sulfatlari zaharli"],
      },
    },
  },

  no3_minus: {
    name: "Nitrat ioni",
    headlineName: "Nitrat anioni",
    customData: {
      level1: {
        type: "Ko'p atomli anion",
        source: "Nitrat kislota dissotsiatsiyasi",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "Yassi trigonal rezonans",
        keyCompounds: [
          { formula: "HNO₃", name: "Nitrat kislota" },
          { formula: "KNO₃", name: "Kaliy selitrasi" },
          { formula: "NH₄NO₃", name: "Ammoniy selitrasi / o'g'it" },
        ],
      },
      level2: {
        molarMass: "62.00 g/mol",
        subatomic: "1 N + 3 O | 32 e⁻",
        statusBanner: "O'simliklar uchun asosiy azot manbai",
        slotA: { label: "Eruvchanlik", result: "Hammasi eriydi", desc: "Barcha oddiy nitratlar suvda juda yaxshi eriydi" },
        slotB: { label: "Oksidlovchi", result: "Kislotali muhitda", desc: "Metallar bilan shiddatli reaksiyaga kirishadi" },
      },
      level3: {
        config: "Sp² gibridlangan (120° burchak)",
        oxidation: "N: +5, O: -2",
        ionicRadius: "179 pm",
        hydrationEnthalpy: "-314 kJ/mol",
        coordination: "Yassi uchburchak",
      },
      level4: {
        discoveryYear: "IX asr",
        discoveredBy: "Jobir ibn Hayyon",
        namedBy: "Yunoncha Nitron (soda/selitra)",
        stse: ["Azot aylanishi biosferada", "Suvlarning evtrofikatsiyasi"],
        commonUses: ["Azotli o'g'itlar", "Portlovchi moddalar va pirotexnika"],
        hazards: ["Ortiqcha nitratlar metgemoglobinemiyaga olib keladi"],
      },
    },
  },

  co3_2minus: {
    name: "Karbonat ioni",
    headlineName: "Karbonat anioni",
    customData: {
      level1: {
        type: "Ko'p atomli oksikislota anioni",
        source: "Karbonat kislotaning to'liq dissotsiatsiyasi",
        phase: "Suvli eritma va qattiq jinslar",
        valence: "Yassi trigonal rezonans (120°)",
        keyCompounds: [
          { formula: "CaCO₃", name: "Marmar, bo'r, ohaktosh" },
          { formula: "Na₂CO₃", name: "Kalsinirlangan soda" },
        ],
      },
      level2: {
        molarMass: "60.01 g/mol",
        subatomic: "1 C + 3 O | 32 e⁻",
        statusBanner: "Yer yuzidagi uglerod ombori",
        slotA: { label: "Kislota bilan", result: "CO₂ qaynaydi", desc: "Kislota tekkanda shiddatli gaz ajraladi" },
        slotB: { label: "Muhit", result: "Ishqoriy pH", desc: "Gidroliz hisobiga eritmada ishqoriy muhit beradi" },
      },
      level3: {
        config: "Sp² gibridlangan (C-O bog' tartibi 1.33)",
        oxidation: "C: +4, O: -2",
        ionicRadius: "178 pm",
        hydrationEnthalpy: "-1314 kJ/mol",
        coordination: "Trigonal planar",
      },
      level4: {
        discoveryYear: "Qadimdan ma'lum",
        discoveredBy: "Qadimgi quruvchilar",
        namedBy: "Lotincha Carbo (ko'mir)",
        stse: ["Global uglerod aylanishi", "Dengiz qobig'i hosil bo'lishi"],
        commonUses: ["Shisha ishlab chiqarish", "Qurilish materiallari"],
        hazards: ["Kislotali yomg'irda yemirilib CO₂ chiqaradi"],
      },
    },
  },

  oh_minus: {
    name: "Gidroksid ioni",
    headlineName: "Gidroksid anioni",
    customData: {
      level1: {
        type: "Ishqoriylik asosi",
        source: "Suvning o'z-o'zidan ionlanishi va ishqorlar",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "Neon okteti (kislorodda 3 ta bo'sh juftlik)",
        keyCompounds: [
          { formula: "NaOH", name: "Kaustik soda" },
          { formula: "KOH", name: "Kaliy ishqori" },
          { formula: "Ca(OH)₂", name: "So'ndirilgan ohak" },
        ],
      },
      level2: {
        molarMass: "17.01 g/mol",
        subatomic: "1 O + 1 H | 10 e⁻",
        statusBanner: "Ishqoriy muhit ko'rsatkichi (pH > 7)",
        slotA: { label: "Fenolftalein", result: "Malina rang", desc: "Rangsiz indikatorni to'q malina rangga bo'yaydi" },
        slotB: { label: "Neytrallanish", result: "H⁺ bilan suv", desc: "H⁺ + OH⁻ → H₂O (ekzotermik reaksiya)" },
      },
      level3: {
        config: "Oktet [Ne]",
        oxidation: "O: -2, H: +1",
        ionicRadius: "133 pm",
        hydrationEnthalpy: "-519 kJ/mol",
        coordination: "Chiziqli dipole",
      },
      level4: {
        discoveryYear: "1884-yil",
        discoveredBy: "Svante Arrenius",
        namedBy: "Gidrogen + Oksigen",
        stse: ["Sanoatda yog'larni sovunlash", "Tuproq kislotaliligini so'ndirish"],
        commonUses: ["Sovun va yuvish vositalari", "Kimyoviy sintez"],
        hazards: ["O'yuvchi (teri va ko'z to'qimasini eritib yuboradi)"],
      },
    },
  },

  nh4_plus: {
    name: "Ammoniy ioni",
    headlineName: "Ammoniy kationi",
    customData: {
      level1: {
        type: "Ko'p atomli kation",
        source: "Ammiakning proton qabul qilishi (donor-akseptor)",
        phase: "Suvli eritma (aq) – rangsiz",
        valence: "Tetraedrik simmetriya",
        keyCompounds: [
          { formula: "NH₄Cl", name: "Novshadil spirti / lehimlash" },
          { formula: "NH₄NO₃", name: "Ammoniy selitrasi" },
          { formula: "(NH₄)₂SO₄", name: "Ammoniy sulfat o'g'iti" },
        ],
      },
      level2: {
        molarMass: "18.04 g/mol",
        subatomic: "1 N + 4 H | 10 e⁻",
        statusBanner: "Ishqoriy metallarga o'xshash xossaga ega",
        slotA: { label: "Sifat reaksiyasi", result: "NH₃ hidi", desc: "Ishqor bilan qizdirilganda o'tkir hidli ammiak ajraladi" },
        slotB: { label: "Lakmus", result: "Ko'karadi", desc: "Ajralgan ammiak gazi qizil lakmusni ko'kartiradi" },
      },
      level3: {
        config: "Sp³ gibridlangan mukammal tetraedr",
        oxidation: "N: -3, H: +1",
        ionicRadius: "148 pm (K⁺ ioniga juda yaqin)",
        hydrationEnthalpy: "-307 kJ/mol",
        coordination: "Tetraedr",
      },
      level4: {
        discoveryYear: "1808-yil",
        discoveredBy: "Hamfri Devi",
        namedBy: "Ammon ibodatxonasi yaqinidagi tuzlar nomidan",
        stse: ["Global oziq-ovqat ishlab chiqarish (Gaber-Bosh)", "Biologik azot zanjiri"],
        commonUses: ["Mineral o'g'itlar", "Elektronika va metall payvandlash"],
        hazards: ["Qizdirilganda portlash xavfi (selitra)"],
      },
    },
  },

  po4_3minus: {
    name: "Fosfat ioni",
    headlineName: "Fosfat anioni",
    customData: {
      level1: {
        type: "Ko'p atomli oksikislota anioni",
        source: "Fosfat kislotaning dissotsiatsiyasi",
        phase: "Suvli eritma va minerallar",
        valence: "Tetraedrik rezonans (109.5°)",
        keyCompounds: [
          { formula: "Ca₃(PO₄)₂", name: "Fosforit / suyak karkasi" },
          { formula: "H₃PO₄", name: "Fosfat kislota" },
        ],
      },
      level2: {
        molarMass: "94.97 g/mol",
        subatomic: "1 P + 4 O | 50 e⁻",
        statusBanner: "Hayotiy energiya tashuvchisi (ATF)",
        slotA: { label: "Sifat reaksiyasi", result: "Sariq cho'kma", desc: "Ag⁺ bilan sariq Ag₃PO₄ cho'kmasi tushadi" },
        slotB: { label: "Biologik rol", result: "ATF va DNK", desc: "DNK zanjiri va ATF energiya akkumulyatori" },
      },
      level3: {
        config: "Sp³ gibridlangan tetraedr",
        oxidation: "P: +5, O: -2",
        ionicRadius: "238 pm",
        hydrationEnthalpy: "-2765 kJ/mol (O'ta kuchli)",
        coordination: "Tetraedr",
      },
      level4: {
        discoveryYear: "1669-yil",
        discoveredBy: "Hennig Brand",
        namedBy: "Yunoncha Phosphoros (yorug'lik tashuvchi)",
        stse: ["Fosforli mineral o'g'itlar (superfosfat)", "Gidrosferada suvo'tlar ko'payishi"],
        commonUses: ["Mineral o'g'itlar", "Oziq-ovqat stabilizatori"],
        hazards: ["Suv havzalarida evtrofikatsiya chaqiradi"],
      },
    },
  },

  mno4_minus: {
    name: "Permanganat ioni",
    headlineName: "Permanganat anioni",
    customData: {
      level1: {
        type: "Kuchli oksidlovchi oksianion",
        source: "Marganesning eng yuqori oksidlanish darajasi (+7)",
        phase: "Suvli eritma – to'q binafsharang",
        valence: "Tetraedrik zaryad ko'chishi",
        keyCompounds: [
          { formula: "KMnO₄", name: "Kaliy permanganat / margansovka" },
        ],
      },
      level2: {
        molarMass: "118.94 g/mol",
        subatomic: "1 Mn + 4 O | 58 e⁻",
        statusBanner: "Tahliliy kimyodagi eng kuchli oksidlovchi",
        slotA: { label: "Rangsizlanish", result: "Kislotada Mn²⁺", desc: "Qaytaruvchilar ta'sirida to'liq rangsizlanadi" },
        slotB: { label: "Rangi", result: "To'q binafsha", desc: "Optik zaryad ko'chishi natijasida intensiv binafsha rang" },
      },
      level3: {
        config: "Tetraedrik Mn(VII) d⁰",
        oxidation: "Mn: +7, O: -2",
        ionicRadius: "240 pm",
        hydrationEnthalpy: "-300 kJ/mol",
        coordination: "Tetraedr",
      },
      level4: {
        discoveryYear: "1774-yil",
        discoveredBy: "Karl Vilgelm Sheele",
        namedBy: "Marganes",
        stse: ["Suvni zararsizlantirish va dezinfeksiya", "Permanganatometriya tahlili"],
        commonUses: ["Antiseptik tibbiyot eritmasi", "Organik sintezda oksidlovchi"],
        hazards: ["Organik moddalar bilan kuchli yonuvchi / portlovchi"],
      },
    },
  },

  cu_2plus: {
    name: "Mis(II) ioni",
    headlineName: "Mis(II) kationi",
    customData: {
      level1: {
        type: "O'tish metalli kationi",
        source: "Misning 2 ta e⁻ yo'qotishi",
        phase: "Suvli eritma – och moviy / ko'k",
        valence: "d⁹ qobig'i (Yan-Teller effekti)",
        keyCompounds: [
          { formula: "CuSO₄·5H₂O", name: "Mis kuporosi" },
          { formula: "Cu(OH)₂", name: "Moviy cho'kma / Trommer reaktivi" },
        ],
      },
      level2: {
        molarMass: "63.55 g/mol",
        subatomic: "29 p⁺ | 27 e⁻",
        statusBanner: "Moviy rangli bio-faol kation",
        slotA: { label: "Ammiak bilan", result: "To'q ko'k rang", desc: "[Cu(NH₃)₄]²⁺ yorqin to'q ko'k kompleks beradi" },
        slotB: { label: "Olov testi", result: "Moviy-yashil", desc: "Olovni chiroyli moviy-yashil rangga bo'yaydi" },
      },
      level3: {
        config: "[Ar] 3d⁹",
        oxidation: "+2",
        ionicRadius: "73 pm",
        hydrationEnthalpy: "-2100 kJ/mol",
        coordination: "6 (Yan-Teller buzilgan oktaedr)",
      },
      level4: {
        discoveryYear: "Qadim zamonlardan ma'lum",
        discoveredBy: "Qadimgi metallurglar",
        namedBy: "Kipr oroli (Cuprum)",
        stse: ["Qishloq xo'jaligida zamburug'larga qarshi bordo suyuqligi", "Gemosianin (mollyuskalar qoni)"],
        commonUses: ["Fungitsidlar", "Galvanika va mikroelementlar"],
        hazards: ["Yuqori konsentratsiyada suv faunasiga zaharli"],
      },
    },
  },

  fe_2plus: {
    name: "Temir(II) ioni",
    headlineName: "Temir(II) kationi",
    customData: {
      level1: {
        type: "O'tish metalli kationi",
        source: "Temirning 2 ta e⁻ yo'qotishi",
        phase: "Suvli eritma – och yashil",
        valence: "d⁶ qobig'i",
        keyCompounds: [
          { formula: "FeSO₄·7H₂O", name: "Temir kuporosi" },
          { formula: "Fe(OH)₂", name: "Yashil-oq cho'kma" },
        ],
      },
      level2: {
        molarMass: "55.85 g/mol",
        subatomic: "26 p⁺ | 24 e⁻",
        statusBanner: "Gemoglobin o'zagi (kislorod tashuvchi)",
        slotA: { label: "Havo bilan", result: "Qo'ng'irga aylanadi", desc: "Kislorod bilan tezda Fe³⁺ ga aylanadi" },
        slotB: { label: "Qon tuzi", result: "Turnbul ko'ki", desc: "K₃[Fe(CN)₆] bilan to'q ko'k cho'kma tushadi" },
      },
      level3: {
        config: "[Ar] 3d⁶",
        oxidation: "+2",
        ionicRadius: "78 pm",
        hydrationEnthalpy: "-1946 kJ/mol",
        coordination: "6 (Oktaedrik)",
      },
      level4: {
        discoveryYear: "Qadim zamonlardan ma'lum",
        discoveredBy: "Qadimgi insonlar",
        namedBy: "Lotincha Ferrum (temir)",
        stse: ["Gemoglobin orqali hujayralarga kislorod yetkazish", "Kamqonlik (anemiya) davosi"],
        commonUses: ["Anemiyaga qarshi dorilar", "Suv tozalash koagulyanti"],
        hazards: ["Organizmda ortiqcha to'planishi gemoxromatoz chaqiradi"],
      },
    },
  },

  fe_3plus: {
    name: "Temir(III) ioni",
    headlineName: "Temir(III) kationi",
    customData: {
      level1: {
        type: "O'tish metalli kationi",
        source: "Temirning 3 ta e⁻ yo'qotishi",
        phase: "Suvli eritma – sariq-qo'ng'ir",
        valence: "Yarim to'lgan barqaror d⁵ qobig'i",
        keyCompounds: [
          { formula: "FeCl₃", name: "Plata o'yuvchi temir xlorid" },
          { formula: "Fe(OH)₃", name: "Qo'ng'ir zang cho'kmasi" },
        ],
      },
      level2: {
        molarMass: "55.85 g/mol",
        subatomic: "26 p⁺ | 23 e⁻",
        statusBanner: "Kuchli gidrolizlanuvchi kation",
        slotA: { label: "Tiosianat (SCN⁻)", result: "Qon-qizil", desc: "SCN⁻ bilan qon kabi qizil Fe(SCN)₃ hosil qiladi" },
        slotB: { label: "Sariq qon tuzi", result: "Berlin lazuri", desc: "K₄[Fe(CN)₆] bilan mashhur to'q ko'k cho'kma beradi" },
      },
      level3: {
        config: "[Ar] 3d⁵ (Yuqori spinli barqaror qobiq)",
        oxidation: "+3",
        ionicRadius: "64 pm",
        hydrationEnthalpy: "-4430 kJ/mol",
        coordination: "6",
      },
      level4: {
        discoveryYear: "Qadim zamonlardan ma'lum",
        discoveredBy: "Qadimgi temirchilar",
        namedBy: "Ferrum",
        stse: ["Korroziya va zang hosil bo'lishi", "Elektron platalarni o'yish"],
        commonUses: ["Radiotexnikada platani kimyoviy o'yish", "Koagulyatsiya"],
        hazards: ["Terini qattiq bo'yab qo'yadi"],
      },
    },
  },

  ch3coo_minus: {
    name: "Atsetat ioni",
    headlineName: "Atsetat anioni",
    customData: {
      level1: {
        type: "Organik kislota anioni",
        source: "Sirka kislotaning dissotsiatsiyasi",
        phase: "Suvli eritma – rangsiz",
        valence: "Karboksilat rezonans delokalizatsiyasi",
        keyCompounds: [
          { formula: "CH₃COOH", name: "Sirka kislota (osh sirkasi)" },
          { formula: "CH₃COONa", name: "Natriy atsetat / issiq muz" },
        ],
      },
      level2: {
        molarMass: "59.04 g/mol",
        subatomic: "2 C + 3 H + 2 O | 32 e⁻",
        statusBanner: "Biologik atsetil-KoA asosi",
        slotA: { label: "Hidi", result: "Sirka hidi", desc: "Kislota qo'shilganda o'tkir sirka hidi taraladi" },
        slotB: { label: "Fe³⁺ bilan", result: "Qo'ng'ir rang", desc: "FeCl₃ bilan qizil-qo'ng'ir kompleks hosil qiladi" },
      },
      level3: {
        config: "Rezonans karboksilat guruhi (C-O teng)",
        oxidation: "C: 0, O: -2, H: +1",
        ionicRadius: "162 pm",
        hydrationEnthalpy: "-406 kJ/mol",
        coordination: "Yassi karboksilat",
      },
      level4: {
        discoveryYear: "Antik davrdan ma'lum",
        discoveredBy: "Sharob tayyorlovchilar",
        namedBy: "Lotincha Acetum (sirka)",
        stse: ["Krebs sikli (metabolizm energetikasi)", "Kimyoviy issiqlik yostiqchalari (issiq muz)"],
        commonUses: ["Oziq-ovqat sanoati (E260)", "Sun'iy tola ishlab chiqarish"],
        hazards: ["Katta konsentratsiyada o'tkir hidli"],
      },
    },
  },
};
