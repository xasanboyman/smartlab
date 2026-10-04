// Human anatomy GLB models. Each entry is a biology topic.
// `?url` import → Vite serves the asset; the file lives in shared/assets/models.
// UI text in Uzbek, slug/code values in English.
import skeletonUrl from "@/shared/assets/models/skeleton.glb?url";
import myologyUrl from "@/shared/assets/models/myology.glb?url";
import ecorcheUrl from "@/shared/assets/models/ecorche_-_anatomy_study.glb?url";
import heartUrl from "@/shared/assets/models/human_heart_3d_model.glb?url";
import lungsUrl from "@/shared/assets/models/realistic_human_lungs.glb?url";
import angiologyUrl from "@/shared/assets/models/angiology.glb?url";
import neurologyUrl from "@/shared/assets/models/neurology.glb?url";
import splanchnologyUrl from "@/shared/assets/models/splanchnology.glb?url";
import digestiveSystemUrl from "@/shared/assets/models/digestive_system.glb?url";
import liverUrl from "@/shared/assets/models/human_liver_and_gallbladder.glb?url";
import kidneyUrl from "@/shared/assets/models/human_kidney.glb?url";
import diaphragmUrl from "@/shared/assets/models/human_diaphragm.glb?url";
import orbitEyeUrl from "@/shared/assets/models/muscles_of_the_orbit_eye.glb?url";
import skullUrl from "@/shared/assets/models/skull.glb?url";
import vertebraeUrl from "@/shared/assets/models/vertebrae.glb?url";
import arthrologyUrl from "@/shared/assets/models/arthrology.glb?url";
import muscularInsertionsUrl from "@/shared/assets/models/muscular_insertions.glb?url";
import handUrl from "@/shared/assets/models/hand.glb?url";
import upperLimbUrl from "@/shared/assets/models/upper-limb.glb?url";
import lowerLimbUrl from "@/shared/assets/models/lower-limb.glb?url";

export const ANATOMY_CATEGORIES = [
  { id: "all", label: "Barcha modellar" },
  { id: "bones", label: "Skelet va Suyaklar" },
  { id: "muscles", label: "Mushaklar tizimi" },
  { id: "organs", label: "Ichki a'zolar & Qon" },
  { id: "head", label: "Bosh & Nerv tizimi" },
];

export const ANATOMY = [
  {
    slug: "skeleton",
    title: "Skelet tizimi (206 suyak)",
    short: "To'liq inson suyak skeletini 3D da har tomondan aylantirib ko'ring.",
    icon: "Bone",
    url: skeletonUrl,
    keepMaterial: true,
    category: "bones",
    about:
      "Inson skeleti 206 ta suyakdan iborat bo'lib, tanaga tayanch beradi, ichki a'zolarni himoya qiladi va mushaklar bilan birga harakatni ta'minlaydi. Suyaklarni bosib nomlari va tuzilishini o'rganishingiz mumkin.",
  },
  {
    slug: "myology",
    title: "Mushaklar tizimi",
    short: "Tana mushaklarining joylashuvini 3D da yaqindan ko'ring.",
    icon: "Dumbbell",
    url: myologyUrl,
    category: "muscles",
    about:
      "Mushaklar tizimi (miologiya) - tana harakatini ta'minlovchi skelet mushaklari. Ular suyaklarga birikib qisqarish orqali harakat hosil qiladi.",
  },
  {
    slug: "ecorche",
    title: "Ekorche (To'liq mushaklar)",
    short: "Mushaklar va tana yuzasi anatomiyasini yuqori aniqlikda o'rganing.",
    icon: "User",
    url: ecorcheUrl,
    keepMaterial: true,
    category: "muscles",
    about:
      "Ekorche - terisiz holatda mushaklarni va ularning anatomik tuzilishini tasvirlovchi professional model. Inson tanasi anatomiyasini chuqur o'rganish uchun.",
  },
  {
    slug: "heart",
    title: "Yurak (3D Realistik)",
    short: "Inson yuragining 3D modelini har tomondan yaqindan kuzating.",
    icon: "Heart",
    url: heartUrl,
    keepMaterial: true,
    category: "organs",
    about:
      "Yurak - qon aylanish tizimining markaziy organi bo'lib, kuniga taxminan 100 000 marta urib butun tanaga qon haydash vazifasini bajaradi.",
  },
  {
    slug: "lungs",
    title: "O'pka va Nafas yo'llari",
    short: "O'pka va bronxlar shoxlanishining 3D anatomik tuzilishini ko'ring.",
    icon: "Wind",
    url: lungsUrl,
    keepMaterial: true,
    category: "organs",
    about:
      "O'pka - nafas olish tizimining asosiy juft a'zosi bo'lib, kislorodni qonga o'tkazib, karbonat angidridni chiqarish vazifasini bajaradi.",
  },
  {
    slug: "angiology",
    title: "Qon-tomir tizimi",
    short: "Arteriya va venalarning butun tanadagi tarmog'ini kuzating.",
    icon: "HeartPulse",
    url: angiologyUrl,
    category: "organs",
    about:
      "Qon-tomir tizimi (angiologiya) - yurak, arteriyalar, venalar va kapillyarlar. Qonni butun tanaga yetkazib, kislorod va oziq moddalarni tashiydi.",
  },
  {
    slug: "neurology",
    title: "Asab tizimi va Miya",
    short: "Bosh miya, orqa miya va nervlar tarmog'ini 3D da ko'ring.",
    icon: "Brain",
    url: neurologyUrl,
    category: "head",
    about:
      "Asab tizimi (nevrologiya) - bosh miya, orqa miya va periferik nervlar. Tana a'zolari o'rtasida signal uzatib, harakat va sezgini boshqaradi.",
  },
  {
    slug: "digestive-system",
    title: "Hazm qilish tizimi",
    short: "Qizilo'ngach, oshqozon va ichaklarning 3D joylashuvini ko'ring.",
    icon: "Utensils",
    url: digestiveSystemUrl,
    keepMaterial: true,
    category: "organs",
    about:
      "Hazm qilish tizimi - ozuqa moddalarini parchalab, energiyani o'zlashtirish uchun xizmat qiladi. Oshqozon, ingichka va yo'g'on ichaklardan iborat.",
  },
  {
    slug: "splanchnology",
    title: "Ichki a'zolar majmuasi",
    short: "Ko'krak va qorin bo'shlig'idagi barcha ichki a'zolarni ko'ring.",
    icon: "Heart",
    url: splanchnologyUrl,
    category: "organs",
    about:
      "Ichki a'zolar (splanxnologiya) - yurak, o'pka, jigar, oshqozon, ichaklar va boshqa a'zolar. Nafas olish, hazm qilish va ayirish jarayonlarini bajaradi.",
  },
  {
    slug: "liver-and-gallbladder",
    title: "Jigar va O't pufagi",
    short: "Jigar bo'laklari va o't pufagi anatomiyasini o'rganing.",
    icon: "Activity",
    url: liverUrl,
    keepMaterial: true,
    category: "organs",
    about:
      "Jigar qonni zaharli moddalardan tozalaydi, oqsillar sintezlaydi. O't pufagi esa yog'larni parchalash uchun o't suyuqligini saqlaydi va hazm vaqtida quyadi.",
  },
  {
    slug: "kidney",
    title: "Buyrak va Siydik yo'li",
    short: "Inson buyragining tuzilishini yaqindan ko'ring.",
    icon: "Droplets",
    url: kidneyUrl,
    keepMaterial: true,
    category: "organs",
    about:
      "Buyrak - qonni filtrlab keraksiz metabolizm qoldiqlarini va ortiqcha suvni siydik orqali ajratib chiqaruvchi juft hayotiy muhim a'zo.",
  },
  {
    slug: "diaphragm",
    title: "Diafragma mushagi",
    short: "Nafas olishda qatnashadigan asosiy gumbazsimon mushakni ko'ring.",
    icon: "Wind",
    url: diaphragmUrl,
    keepMaterial: true,
    category: "muscles",
    about:
      "Diafragma - ko'krak va qorin bo'shliqlarini ajratib turuvchi, nafas olish jarayonida qatnashadigan asosiy gumbazsimon harakatlanuvchi mushak.",
  },
  {
    slug: "eye-orbit-muscles",
    title: "Ko'z va Ko'z kosasi mushaklari",
    short: "Ko'zni barcha tomonga harakatlantiruvchi mushaklarni ko'ring.",
    icon: "Eye",
    url: orbitEyeUrl,
    keepMaterial: true,
    category: "head",
    about:
      "Ko'z kosasi mushaklari - ko'z soqqasini yuqoriga, pastga, chapga va o'ngga burish hamda ko'rish yo'nalishini belgilash imkonini beradi.",
  },
  {
    slug: "skull",
    title: "Bosh suyagi (Kalla)",
    short: "Bosh suyagi bo'laklarini rangli ajratib o'rganing.",
    icon: "Skull",
    url: skullUrl,
    keepMaterial: true,
    category: "bones",
    about:
      "Bosh suyagi (kranium) - miya va sezgi a'zolarini himoya qiluvchi suyaklar. Peshona, tepa, chakka, ensa va yuz suyaklari alohida ko'rsatilgan.",
  },
  {
    slug: "vertebrae",
    title: "Umurtqalar",
    short: "Umurtqa suyagining murakkab tuzilishini yaqindan ko'ring.",
    icon: "Bone",
    url: vertebraeUrl,
    keepMaterial: true,
    category: "bones",
    about:
      "Umurtqalar - umurtqa pog'onasini tashkil etuvchi suyaklar. Har biri tana, yoy va o'siqlardan iborat bo'lib, orqa miyani mustahkam himoyalaydi.",
  },
  {
    slug: "arthrology",
    title: "Bo'g'imlar tizimi",
    short: "Suyaklar birlashadigan barcha bo'g'imlarni o'rganing.",
    icon: "Bone",
    url: arthrologyUrl,
    category: "bones",
    about:
      "Bo'g'imlar tizimi (artrologiya) - suyaklarni o'zaro harakatchan bog'lovchi bo'g'imlar. Ular tananing egiluvchanligi va harakat doirasini ta'minlaydi.",
  },
  {
    slug: "muscular-insertions",
    title: "Mushak birikmalari",
    short: "Mushaklarning suyaklarga birikish nuqtalarini ko'ring.",
    icon: "Link",
    url: muscularInsertionsUrl,
    category: "muscles",
    about:
      "Mushak birikmalari - mushaklarning suyaklarga boshlanish (origo) va tugash (insertio) nuqtalari. Qaysi suyak qanday tortilishini ko'rsatadi.",
  },
  {
    slug: "hand",
    title: "Qo'l panjasi",
    short: "Panja suyaklari va mayda bo'g'imlarini ko'ring.",
    icon: "Hand",
    url: handUrl,
    keepMaterial: true,
    category: "bones",
    about:
      "Qo'l panjasi - bilak-kaft (karpal), kaft (metakarpal) va barmoq (falanga) suyaklaridan iborat. Inson eng nozik harakatlarni shu tuzilma orqali bajaradi.",
  },
  {
    slug: "upper-limb",
    title: "Yuqori oyoq-qo'l",
    short: "Yelka, bilak va panja suyaklarini birgalikda ko'ring.",
    icon: "Dumbbell",
    url: upperLimbUrl,
    keepMaterial: true,
    category: "bones",
    about:
      "Yuqori oyoq-qo'l - yelka suyagi, bilak va tirsak suyaklari hamda panja suyaklari majmuasi.",
  },
  {
    slug: "lower-limb",
    title: "Pastki oyoq-qo'l",
    short: "Son, boldir va oyoq panjasi suyaklarini ko'ring.",
    icon: "Footprints",
    url: lowerLimbUrl,
    keepMaterial: true,
    category: "bones",
    about:
      "Pastki oyoq-qo'l - son suyagi, tizza qopqog'i, boldir suyaklari va oyoq panjasi. Tana og'irligini ko'taradi va yurishni ta'minlaydi.",
  },
];

export const getAnatomy = (slug) =>
  ANATOMY.find((a) => a.slug === slug) || ANATOMY[0];
