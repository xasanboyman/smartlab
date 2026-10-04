// Gemini orqali 3D yodgorlikning bir qismini (yoki foydalanuvchi savolini)
// tanlangan daraja bo'yicha o'zbekcha tushuntiradi. API kalit bo'lmasa, mukammal mahalliy bilimlar bazasi ishlaydi.
import env from "../../../config/env.js";

export const isConfigured = () => Boolean(env.GEMINI_API_KEY);

const LEVEL_HINT = {
  kids: "8-12 yoshli bolaga mos: juda sodda, hayajonli",
  school: "maktab o'quvchisiga mos: aniq va tushunarli",
  highschool: "yuqori sinf: atamalar bilan chuqurroq",
  university: "universitet: ilmiy, arxitektura atamalari bilan",
  exam: "imtihon uchun: qisqa faktlar (sana, ism, atama)",
  tourist: "sayyoh uchun: jonli, qiziqarli, 'nimaga e'tibor bering'",
};

const SYSTEM = `Sen Samarqanddagi Registon majmuasi bo'yicha bilimdon, do'stona muzey audio-gidisisan.
Foydalanuvchi 3D modelda biror qismni bosdi. Faqat O'ZBEK tilida (lotin), faqat shu qismga oid,
aniq va tarixiy faktga asoslangan javob ber. Uydirma ma'lumot berma. Javob 3-5 jumladan oshmasin.`;

const REGISTAN_DATA = {
  overview: {
    kids: "Registon — Samarqand yuragidagi ulkan maydon! Uni uch tomondan koshinli, ko'k gumbazli uchta chiroyli madrasa o'rab turadi.",
    school:
      "Registon — Samarqand markazidagi mashhur maydon. Uni uchta madrasa o'rab turadi: Ulug'bek (1417–1420), Sher-Dor (1619–1636) va Tillakori (1646–1660).",
    highschool:
      "Registon ansambli uch madrasadan iborat: Ulug'bek, Sher-Dor va Tillakori. Ularning fasadlarini ulkan pishtoqlar, feruza gumbazlar va burchak minoralari birlashtiradi. UNESCO Jahon merosi ro'yxatiga kiritilgan.",
    university:
      "Registon — Movarounnahr me'morchiligining eng yaxlit ansambllaridan biri: uchta madrasa (Ulug'bek 1417–1420, Sher-Dor 1619–1636, Tillakori 1646–1660) yagona kompozitsiya hosil qiladi.",
    tourist:
      "Maydon o'rtasida turib atrofga bir aylanib qarang: uch tomonda uchta madrasa sizni o'rab oladi. Ularning pishtoqlari, ko'k gumbazlari va koshin bezaklari bir-birini to'ldiradi.",
  },
  entrance: {
    kids: "Oldingda osmonga cho'zilgan ulkan darvoza — pishtoq turibdi! U shunchalik kattaki, yonida odam kichkina bo'lib qoladi.",
    school:
      "Bu ulkan tokli portal — pishtoq deyiladi. U madrasaning eng baland va bosh qismi bo'lib, yuzasi rangli koshinlar bilan qoplangan.",
    highschool:
      "Pishtoq — madrasa fasadining markaziy, baland tokli portali. Sirti girih va islimiy naqshli koshinkori bilan bezatilgan.",
    university:
      "Pishtoq — Markaziy Osiyo me'morchiligining asosiy vertikal kompozitsion dominantasi bo'lib, ziyoratchini ichki dahlizga yo'naltiradi.",
    tourist:
      "Pishtoqning ulkan balandligiga e'tibor bering. Yuzasidagi har bir koshin bir necha yuz yil oldin mohir ustalar tomonidan qo'lda terilgan.",
  },
  "main-gate": {
    kids: "Pishtoq ostida katta darvoza bor. Undan o'tsang, madrasaning ichki hovlisiga kirasan!",
    school:
      "Pishtoqning ostida bosh darvoza joylashgan. Undan o'tgan talaba darsxonalar joylashgan ichki hovliga chiqadi.",
    highschool:
      "Bosh darvoza tashqi maydon bilan ichki hovlini bog'laydi. Darvoza ravog'i muqarnas bezaklari bilan qoplangan.",
    university:
      "Bosh darvoza dahliz orqali ziyoratchini yorug' ichki hovliga olib chiqadi. Bu yerda yorug'lik va soya o'yini me'moriy ta'sirni kuchaytiradi.",
    tourist:
      "Darvozadan o'tayotganda ravoq ostiga qarang — yuqorida asalari uyasiga o'xshash muqarnas bezaklarini ko'rasiz.",
  },
  dome: {
    kids: "Yuqoriga qara — osmonga o'xshagan ko'k gumbaz! U feruza rangda tovlanib turadi.",
    school:
      "Madrasalar ustida ko'k — feruza rangli gumbazlar bor. Feruza rang Samarqand me'morchiligining bosh ramzidir.",
    highschool:
      "Feruza gumbazlar madrasa siluetining eng yuqori nuqtasi hisoblanadi. Ular koshin qoplama bilan bezatilib, osmon bilan uyg'unlashadi.",
    university:
      "Gumbazlar ikki qavatli konstruksiya bo'lib, baland silindrik baraban ustiga o'rnatilgan va sirlangan koshinlar bilan qoplangan.",
    tourist:
      "Gumbazning feruza rangiga e'tibor bering — u kunning turli vaqtlarida quyosh nuri ostida boshqacha tusda tovlanadi.",
  },
  minaret: {
    kids: "Madrasaning burchaklarida uzun minoralar bor. Zilzila bir marta ularni bir tomonga qiyshaytirib qo'ygan!",
    school:
      "Madrasa burchaklarida baland minoralar joylashgan. 1897-yilgi zilziladan so'ng ular muhandislik ishlari yordamida tiklangan.",
    highschool:
      "Burchak minoralari fasad kompozitsiyasini yakunlaydi. XX asrdagi noyob restavratsiya ishlari natijasida og'gan minoralar to'g'rilangan.",
    university:
      "Minoralar burchak vertikal ramkasini hosil qilib, fazoviy mutanosiblikni ta'minlaydi. Ular g'ishtin naqshlar bilan terilgan.",
    tourist:
      "Minoralarga diqqat bilan qarang — ular 1897-yilgi kuchli zilziladan omon qolgan va ustalarning mahorati bilan asrab qolingan.",
  },
  mosaic: {
    kids: "Devorga qara — bu yerda sher va uning ustida quyosh chizilgan! Bunday rasm boshqa hech qayerda yo'q.",
    school:
      "Sher-Dor madrasasi peshtog'ida sher va quyoshli yuz tasviri bor. Shu sababli madrasa 'Sher-Dor', ya'ni 'sherli' deb ataladi.",
    highschool:
      "Koshinkori va mozaika devorlarni sirlangan plitkalar bilan bezaydi. Sher-Dor peshtog'idagi jonivor tasviri sharq me'morchiligida noyob hodisadir.",
    university:
      "Registon devorlari girih (geometrik), islimiy (o'simliksimon) va xattotlik koshinkorisi bilan qoplangan. Sher-Dor peshtog'i quyosh va sher simvolizmi bilan ajralib turadi.",
    tourist:
      "Sher-Dor peshtog'idagi quyoshli sher tasvirini toping — bu Registonning eng mashhur timsoli hisoblanadi.",
  },
  courtyard: {
    kids: "Madrasaning ichiga kirsang, ochiq hovli bor. Uni o'rab, talabalar yashaydigan kichik hujralar joylashgan.",
    school:
      "Madrasaning o'rtasida ochiq ichki hovli bor. Uni to'rt tomondan talabalar yashaydigan va o'qiydigan hujralar o'rab turadi.",
    highschool:
      "Ichki hovli chor ayvonli kompozitsiyaga ega bo'lib, ikki qavatli hujralar bilan o'ralgan.",
    university:
      "Markaziy hovli ichki mikroklimatni mo''tadillashtiradi va ta'lim-tarbiya jarayoni uchun xilvat osoyishtalik muhitini yaratadi.",
    tourist:
      "Hovliga chiqib, atrofga qarang — qalin g'isht devorlar tashqi dunyo shovqinini butunlay to'sib, tinchlik baxsh etadi.",
  },
  classroom: {
    kids: "Bu xonalarda talabalar dars olishgan. Ular yulduzlar, hisob-kitob va kitoblar haqida o'rganishgan!",
    school:
      "Hujra va darsxonalarda talabalar dars olishgan. Ulug'bek madrasasida astronomiya, matematika va ilohiyot o'qitilgan.",
    highschool:
      "Ulug'bek madrasasi o'z davrining yetakchi ilmiy markazi bo'lib, Mirzo Ulug'bek bu yerda talabalarga matematika va falakiyotdan saboq bergan.",
    university:
      "XV asrda bu maskan rasadxona ilmiy xodimlari va mudarrislar yetishib chiqadigan oliy dargoh vazifasini bajargan.",
    tourist:
      "Bu xonalarda asrlar ilgari olimlar osmon sirlarini va matematika qonuniyatlarini kashf etganini tasavvur qiling.",
  },
};

export const fallbackExplain = ({ building, part, level, question }) => {
  const lvl = level || "tourist";
  const partKey = String(part || "entrance").toLowerCase().trim();

  let matchedData = REGISTAN_DATA[partKey] || null;
  if (!matchedData) {
    for (const [k, v] of Object.entries(REGISTAN_DATA)) {
      if (partKey.includes(k) || k.includes(partKey)) {
        matchedData = v;
        break;
      }
    }
  }

  if (!matchedData) {
    matchedData = REGISTAN_DATA.overview;
  }

  let text = matchedData[lvl] || matchedData.school || matchedData.tourist;

  if (question && question.trim()) {
    const q = question.toLowerCase();
    if (q.includes("qachon") || q.includes("sana") || q.includes("asr")) {
      text +=
        " Tarixiy fakt: Ulug'bek madrasasi 1417–1420 yillarda, Sher-Dor 1619–1636 yillarda, Tillakori esa 1646–1660 yillarda qurilgan.";
    } else if (q.includes("kim") || q.includes("asoschi")) {
      text +=
        " Tarixiy fakt: Eng birinchi madrasani buyuk astronom Mirzo Ulug'bek, keyingi ikkitasini esa Samarqand hokimi Yalangto'sh Bahodir bunyod ettirgan.";
    } else if (q.includes("sher")) {
      text +=
        " Sher-Dor peshtog'idagi sher va quyosh tasviri buyuklik, adolat va ilm ziyosining g'alabasini ifodalaydi.";
    } else {
      text += ` Siz so'ragan "${question.trim()}" masalasi ham ushbu me'moriy durdonaning ko'p asrlik boy tarixi bilan chambarchas bog'liqdir.`;
    }
  }

  return { text };
};

export const explainPart = async (
  { building, part, level, question },
  { signal } = {},
) => {
  if (!isConfigured()) {
    return fallbackExplain({ building, part, level, question });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            parts: [
              {
                text: `${building || "Registon"} majmuasidagi "${part}" qismini ${LEVEL_HINT[level] || LEVEL_HINT.tourist} darajasida tushuntir.${question ? ` Savol: ${question}` : ""}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal,
    });

    if (res.status === 429 || !res.ok) {
      return fallbackExplain({ building, part, level, question });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallbackExplain({ building, part, level, question });

    return { text: text.trim().slice(0, 1200) };
  } catch (err) {
    return fallbackExplain({ building, part, level, question });
  }
};
