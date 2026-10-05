import { Outlet } from "react-router-dom";
import LabHeader from "@/lab/components/LabHeader";

// Layout WITH header - used for content pages (landing, subject, 404).
const LabLayout = () => (
  <div className="flex min-h-dvh flex-col bg-[#090b12] text-zinc-100">
    <LabHeader />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

export default LabLayout;
