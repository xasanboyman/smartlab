// Reads /:subject/:topic and renders the matching 3D topic page.
// Topic pages are lazy-loaded so the heavy 3D code is split out of the main bundle.
import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";

const PAGES = {
  // One page for all human-anatomy systems; the active one is picked in-page.
  "biology/anatomy": lazy(() =>
    import("@/lab/features/biology/anatomy/AnatomyPage"),
  ),
  "chemistry/molecules": lazy(() =>
    import("@/lab/features/chemistry/molecules/MoleculesPage"),
  ),
  // Walk-in chemistry lab room (the yaxyobekuz/smartlab blueprint: WASD, E cabinet, 5 slots, pouring, breakable glass).
  "chemistry/lab": lazy(() =>
    import("@/lab/features/chemistry/lab-room/LabRoomPage"),
  ),
  // HTML-in-Canvas bench with the html-cloth journal, kept on a side route.
  "chemistry/lab-html": lazy(() =>
    import("@/lab/features/chemistry/html-lab/HtmlLabPage"),
  ),
  "chemistry/atoms": lazy(() =>
    import("@/lab/features/chemistry/atoms/AtomsPage"),
  ),
  "chemistry/periodic-table": lazy(() =>
    import("@/lab/features/chemistry/periodic/PeriodicTablePage"),
  ),
  "biology/cell": lazy(() => import("@/lab/features/biology/cell/CellPage")),
  "biology/cell-studio": lazy(() =>
    import("@/lab/features/biology/cell-studio/CellStudioPage"),
  ),
  "biology/dna": lazy(() => import("@/lab/features/biology/dna/DnaPage")),
  "biology/human-atlas": lazy(() =>
    import("@/lab/features/biology/human-atlas/HumanAtlasPage"),
  ),
  "biology/surgery": lazy(() =>
    import("@/lab/features/biology/surgery/SurgeryPage"),
  ),
  "biology/simulator": lazy(() =>
    import("@/lab/features/biology/simulator/SimulatorPage"),
  ),
  "physics/engine": lazy(() =>
    import("@/lab/features/physics/engine/EnginePage"),
  ),
  "electronics/arduino": lazy(() =>
    import("@/lab/features/electronics/circuit/CircuitPage"),
  ),
  "chemistry/ph": lazy(() => import("@/lab/features/chemistry/ph/PhPage")),
  "chemistry/gas-laws": lazy(() =>
    import("@/lab/features/chemistry/gas-laws/GasLawsPage"),
  ),
  "biology/genetics": lazy(() =>
    import("@/lab/features/biology/genetics/GeneticsPage"),
  ),
  "history/registan": lazy(() =>
    import("@/lab/features/history/registan/RegistanGuidePage"),
  ),
  "history/atlas": lazy(() =>
    import("@/lab/features/history/atlas/AtlasPage"),
  ),
};

const Fallback = () => (
  <div className="container grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
    Yuklanmoqda...
  </div>
);

const TopicPage = () => {
  const { subject, topic } = useParams();
  const Page = PAGES[`${subject}/${topic}`];
  if (!Page) return <NotFoundPage />;
  return (
    <Suspense fallback={<Fallback />}>
      <Page />
    </Suspense>
  );
};

export default TopicPage;
