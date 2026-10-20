// Chemistry reference built on Zperiod (MIT, github.com/Zhilips/Zperiod), mounted natively from the
// vendored module (client/zperiod/src/embed.js): periodic table with 3D atoms, ion engine, chemistry
// tools and the worksheet generator. One route per section; the section tabs are real routes so deep
// links stay shareable, and the Zperiod DOM is kept alive between route changes.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Grid3x3, Zap, Wrench, FileText, Settings, Maximize2, Minimize2, Keyboard } from "lucide-react";
import LabHeader from "@/lab/components/LabHeader";
import { mountZperiod, unmountZperiod, showPage } from "@zperiod/embed";
import "./ZperiodPage.css";

export const ZPERIOD_SECTIONS = [
  { topic: "periodic-table", page: "table", label: "Davriy jadval", icon: Grid3x3 },
  { topic: "ions", page: "ions", label: "Ionlar", icon: Zap },
  { topic: "chem-tools", page: "tools", label: "Vositalar", icon: Wrench },
  { topic: "worksheet", page: "worksheet", label: "Ish varaqasi", icon: FileText },
  { topic: "chem-settings", page: "settings", label: "Sozlamalar", icon: Settings },
];

const ZperiodPage = () => {
  const { topic } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const hostRef = useRef(null);
  const searchRef = useRef(null);
  const topicRef = useRef(topic);
  const [full, setFull] = useState(false);

  const section = ZPERIOD_SECTIONS.find((s) => s.topic === topic) || ZPERIOD_SECTIONS[0];
  topicRef.current = topic;

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
    <div ref={pageRef} className="zp-page">
      <LabHeader />
      <div className="zp-bar">
        <Link to="/chemistry" className="zp-back">
          <ArrowLeft size={14} /> Kimyo
        </Link>
        <nav className="zp-tabs" aria-label="Bo'limlar">
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
        </nav>
        <div className="zp-search" ref={searchRef} />
        <div className="zp-actions">
          <span className="zp-kbd" title="Element oynasida: ← → Probel — qatlamlar, Esc — yopish">
            <Keyboard size={13} /> ← → Esc
          </span>
          <button type="button" className="zp-ic" onClick={toggleFull} title="To'liq ekran" aria-label="To'liq ekran">
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>
      <div className="zp-host" ref={hostRef} />
    </div>
  );
};

export default ZperiodPage;
