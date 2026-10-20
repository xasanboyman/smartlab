// Chemistry reference built on Zperiod (MIT, github.com/Zhilips/Zperiod), mounted natively from the
// vendored module (client/zperiod/src/embed.js): periodic table with 3D atoms, ion engine, chemistry
// tools and the worksheet generator. One route per section; the section tabs are real routes so deep
// links stay shareable, and the Zperiod DOM is kept alive between route changes.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, NavLink } from "react-router-dom";
import {
  Grid3x3,
  Zap,
  Wrench,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  Keyboard,
  FlaskConical,
  Sun,
  Moon,
  ChevronDown,
  Bot,
  Glasses,
  Dna,
  Atom,
  Cpu,
  Landmark,
} from "lucide-react";
import NexusLogo from "@/shared/components/ui/NexusLogo";
import { mountZperiod, unmountZperiod, showPage } from "@zperiod/embed";
import "./ZperiodPage.css";

export const ZPERIOD_SECTIONS = [
  { topic: "periodic-table", page: "table", label: "Davriy jadval", icon: Grid3x3 },
  { topic: "ions", page: "ions", label: "Ionlar", icon: Zap },
  { topic: "chem-tools", page: "tools", label: "Vositalar", icon: Wrench },
  { topic: "worksheet", page: "worksheet", label: "Ish varaqasi", icon: FileText },
  { topic: "chem-settings", page: "settings", label: "Sozlamalar", icon: Settings },
];

const OTHER_SUBJECTS = [
  { slug: "chemistry", title: "Kimyo", icon: FlaskConical },
  { slug: "biology", title: "Biologiya", icon: Dna },
  { slug: "physics", title: "Fizika", icon: Atom },
  { slug: "electronics", title: "Elektronika", icon: Cpu },
  { slug: "history", title: "Tarix", icon: Landmark },
];

const ZperiodPage = () => {
  const { topic } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const hostRef = useRef(null);
  const searchRef = useRef(null);
  const topicRef = useRef(topic);
  const [full, setFull] = useState(false);
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);

  // Dynamic Dark / Light theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("smartlab_theme") || "dark";
  });

  const section = ZPERIOD_SECTIONS.find((s) => s.topic === topic) || ZPERIOD_SECTIONS[0];
  topicRef.current = topic;

  // Apply theme to document and body
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("dark-theme", theme === "dark");
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("smartlab_theme", theme);
    localStorage.setItem("zperiod_theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    mountZperiod(hostRef.current, {
      page: section.page,
      lang: "uz",
      searchSlot: searchRef.current,
      onPageChange: (page) => {
        const target = ZPERIOD_SECTIONS.find((s) => s.page === page);
        if (target && target.topic !== topicRef.current) navigate(`/chemistry/${target.topic}`, { replace: true });
      },
    });
    return () => unmountZperiod();
    // Mount once; later section changes go through showPage below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    showPage(section.page);
  }, [section.page]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else pageRef.current?.requestFullscreen?.();
  }, []);

  return (
    <div ref={pageRef} className="zp-page" data-theme={theme}>
      {/* Unified Single Modern Chemistry Header */}
      <header className="zp-header">
        {/* Left: Brand & Subject Menu */}
        <div className="zp-header-left">
          <NexusLogo size="sm" showSubtitle={false} />

          <div className="zp-subject-dropdown-wrap">
            <button
              type="button"
              className="zp-subject-pill"
              onClick={() => setSubjectMenuOpen((v) => !v)}
              aria-label="Fanlar ro'yxati"
              aria-expanded={subjectMenuOpen}
            >
              <FlaskConical size={14} className="text-emerald-400" />
              <span className="font-bold text-xs">Kimyo</span>
              <ChevronDown size={12} className={`transition-transform ${subjectMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {subjectMenuOpen && (
              <>
                <div className="zp-dropdown-backdrop" onClick={() => setSubjectMenuOpen(false)} />
                <div className="zp-subject-dropdown-menu">
                  <div className="zp-dropdown-title">Barcha laboratoriyalar</div>
                  {OTHER_SUBJECTS.map((sub) => {
                    const SubIcon = sub.icon;
                    const isCurrent = sub.slug === "chemistry";
                    return (
                      <NavLink
                        key={sub.slug}
                        to={`/${sub.slug}`}
                        onClick={() => setSubjectMenuOpen(false)}
                        className={`zp-dropdown-item ${isCurrent ? "active" : ""}`}
                      >
                        <SubIcon size={14} />
                        <span>{sub.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: Chemistry Section Tabs */}
        <nav className="zp-tabs" aria-label="Kimyo bo'limlari">
          {ZPERIOD_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.topic === section.topic;
            return (
              <Link
                key={s.topic}
                to={`/chemistry/${s.topic}`}
                className={`zp-tab ${active ? "active" : ""} ${s.page === "settings" ? "icon" : ""}`}
                title={s.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </Link>
            );
          })}
          {/* Link to 3D walk-in lab */}
          <Link to="/chemistry/lab" className="zp-tab lab-tab" title="3D Laboratoriya xonasi">
            <FlaskConical size={14} className="text-amber-400" />
            <span>3D Lab</span>
          </Link>
        </nav>

        {/* Right: Search, Theme Toggle, Actions, Riko AI */}
        <div className="zp-header-right">
          <div className="zp-search" ref={searchRef} />

          <span className="zp-kbd" title="Element oynasida: ← → Probel — qatlamlar, Esc — yopish">
            <Keyboard size={13} /> ← → Esc
          </span>

          {/* Dynamic Dark/Light Theme Switcher Button */}
          <button
            type="button"
            className="zp-ic theme-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Yorug' mavzuga o'tish (Light Mode)" : "Qorong'i mavzuga o'tish (Dark Mode)"}
            aria-label="Mavzuni almashtirish"
          >
            {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-blue-500" />}
          </button>

          {/* Fullscreen Button */}
          <button type="button" className="zp-ic" onClick={toggleFull} title="To'liq ekran" aria-label="To'liq ekran">
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Quick Shortcuts */}
          <Link
            to="/riko"
            className="zp-btn-riko"
            title="Riko — 3D AI hamroh (Quantum VRM, Gemini Live)"
          >
            <Bot size={13} />
            <span>Riko AI</span>
          </Link>

          <Link
            to="/chemistry/lab?vr=1"
            className="zp-btn-vr"
            title="Cardboard / WebXR VR laboratoriya"
          >
            <Glasses size={13} />
            <span>VR</span>
          </Link>
        </div>
      </header>

      {/* Main Mount Host */}
      <div className="zp-host" ref={hostRef} />
    </div>
  );
};

export default ZperiodPage;
