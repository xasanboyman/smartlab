# SmartLab - 3D virtual laboratoriya

SmartLab - o'quvchilar uchun **interaktiv 3D virtual laboratoriya**. Kimyo, biologiya va
fizika mavzularini brauzerda aylantirib, yaqindan ko'rib o'rganish mumkin. Loyihaga
**Mira AI** yordamchisi va **Cardboard (gyroskop) VR** rejimi ham qo'shilgan.

Texnik jihatdan bu **monorepo**: `React (Vite)` frontend + `Express + MongoDB` backend.
Loyiha Prezentatsiyasi - https://gamma.app/docs/Istalgan-joyda-istalgan-vaqtdaxavfsiz-laboratoriya-tajribalari-a8jaj92f50sh3cd
---

## ✨ Asosiy imkoniyatlar

- **3D mavzular** - `three.js` + React Three Fiber asosida:
  - 🧪 **Kimyo** - molekulalar (suv, CO₂, metan...), atomlar (yadro + orbita), interaktiv laboratoriya (reaktivlarni quyib reaksiyalarni kuzatish).
  - 🧫 **Biologiya** - hujayra organoidlari, DNK qo'sh spirali, odam anatomiyasi (mushak, qon-tomir, asab, bo'g'im, ichki a'zolar).
  - 🔭 **Fizika** - Quyosh tizimi (orbital aylanish), to'lqin va mayatnik tebranishi.
- **Mira AI** - laboratoriya ichida savol-javob qiluvchi AI yordamchi (OpenAI orqali).
- **Cardboard VR** - telefon gyroskopi yordamida 3D sahnani VR ko'rinishida ko'rish.
- **Bug report** - ixtiyoriy Telegram bot orqali xatolik xabarini yuborish.

---

## 🗂 Loyiha tuzilmasi

```
smartlab/
├─ client/          # Frontend: Vite + React 19 + Three.js + Redux + TanStack Query
├─ server/          # Backend: Node.js + Express + MongoDB (Mongoose) + Agenda + AI
├─ CLAUDE.md        # Loyiha qoidalari (umumiy)
└─ .claude/         # Claude Code uchun skill va konfiguratsiyalar
```

Batafsil qoidalar: [client/CLAUDE.md](client/CLAUDE.md) va [server/CLAUDE.md](server/CLAUDE.md).

---

## 🧰 Texnologiyalar

**Frontend** (`client/`)
- React 19 + Vite 7
- Three.js, `@react-three/fiber`, `@react-three/drei` - 3D sahna
- Redux Toolkit, TanStack Query - holat va API
- Tailwind CSS + shadcn/ui - interfeys
- React Router 7

**Backend** (`server/`)
- Node.js + Express 4
- MongoDB + Mongoose
- JWT auth (access + refresh), Agenda (fon vazifalari)
- OpenAI SDK - Mira AI yordamchisi
- Helmet, CORS, rate-limit, Pino logger

---

## 🚀 Ishga tushirish

Talablar: **Node.js 18+**, **MongoDB** (lokal yoki Atlas), va Mira AI uchun **OpenAI API kaliti**.

### 1. Repozitoriyani klonlash

```bash
git clone https://github.com/xasanboyman/smartlab.git
cd smartlab
```

### 2. Backend (`server/`)

```bash
cd server
cp .env.example .env       # so'ng .env qiymatlarini to'ldiring
npm install
npm run dev                # http://localhost:5000
```

`.env` ichidagi muhim qiymatlar:

| O'zgaruvchi | Tavsif |
|---|---|
| `PORT` | Server porti (default `5000`) |
| `MONGO_URL` | MongoDB ulanish manzili |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT maxfiy kalitlari |
| `CLIENT_URL` | Frontend manzili (CORS uchun, default `http://localhost:5173`) |
| `OPENAI_API_KEY` | Mira AI uchun OpenAI kaliti |
| `OPENAI_MODEL` | AI modeli (default `gpt-4o-mini`) |

### 3. Frontend (`client/`)

Yangi terminalda:

```bash
cd client
cp .env.example .env       # so'ng .env qiymatlarini to'ldiring
npm install
npm run dev                # http://localhost:5173
```

`.env` ichidagi qiymatlar:

| O'zgaruvchi | Tavsif |
|---|---|
| `VITE_API_URL` | Backend API manzili (default `http://localhost:5000/api`) |
| `VITE_BUG_REPORT_BOT_TOKEN` | (Ixtiyoriy) Telegram bot token - bug report uchun |
| `VITE_BUG_REPORT_CHAT_ID` | (Ixtiyoriy) Telegram chat ID - bug report uchun |

### 4. Brauzerda ochish

Frontend tayyor bo'lgach, brauzerda **http://localhost:5173** manzilini oching.

---

## 🧭 Sahifalar va yo'nalishlar

| Yo'nalish | Sahifa |
|---|---|
| `/` | Bosh sahifa - fanlar ro'yxati |
| `/:subject` | Fan sahifasi - mavzular ro'yxati (masalan `/chemistry`) |
| `/:subject/:topic` | 3D ish maydoni - to'liq ekran (masalan `/chemistry/molecules`) |

Mavjud fanlar va mavzular ro'yxati: [client/src/lab/data/subjects.js](client/src/lab/data/subjects.js).

---

## 📜 Mavjud skriptlar

**Frontend** (`client/`)
```bash
npm run dev       # dev server (port 5173)
npm run build     # production build
npm run preview   # build natijasini ko'rish
npm run lint      # ESLint
```

**Backend** (`server/`)
```bash
npm run dev       # nodemon bilan dev rejimi
npm start         # production rejimi
npm run lint      # ESLint
```

---

## 📁 Frontend ichki tuzilmasi (qisqacha)

```
client/src/
├─ app/            # routes, store, query-client
├─ shared/         # global komponentlar (ui, shadcn, layout), hooks, utils
└─ lab/            # laboratoriya yadrosi
   ├─ components/  # Scene, AiPanel, CardboardView, Toolbar, ...
   ├─ features/    # chemistry / biology / physics - har mavzu alohida
   ├─ data/        # subjects, molecules, atoms, anatomy, planets, ...
   ├─ pages/       # LandingPage, SubjectPage, TopicPage
   └─ layouts/     # LabLayout, LabWorkspaceLayout
```

Backend tuzilmasi: [server/CLAUDE.md](server/CLAUDE.md).

---

## 🌐 Til qoidasi

- **Foydalanuvchiga ko'rinadigan matn** - o'zbek tilida.
- **Kod qiymatlari** (id, route, slug, query key) - ingliz tilida.

---

## 👨‍💻 Muallif va Rivojlantiruvchi

**Abdulkhayev Hasanboy**
- GitHub: [@xasanboyman](https://github.com/xasanboyman)
- Repository: [smartlab](https://github.com/xasanboyman/smartlab)
- Email: casanboyyy@gmail.com
