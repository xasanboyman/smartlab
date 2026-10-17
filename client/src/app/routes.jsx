// Router
import { Routes as RoutesWrapper, Route } from "react-router-dom";

// Lab (public 3D laboratory)
import {
  LabLayout,
  LabWorkspaceLayout,
  LandingPage,
  SubjectPage,
  TopicPage,
  NotFoundPage,
  RikoPage,
} from "@/lab";

const Routes = () => (
  <RoutesWrapper>
    {/* Landing - full-page, carries its own header */}
    <Route index element={<LandingPage />} />

    {/* Riko AI companion (Quantum VRM) - full-page, own navbar */}
    <Route path="/riko" element={<RikoPage />} />

    {/* Content pages - with header */}
    <Route element={<LabLayout />}>
      <Route path="/:subject" element={<SubjectPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    {/* 3D workspace - no header, full screen */}
    <Route element={<LabWorkspaceLayout />}>
      <Route path="/:subject/:topic" element={<TopicPage />} />
    </Route>
  </RoutesWrapper>
);

export default Routes;
