// Human anatomy page with high-quality 3D native WebGL models.
// Allows choosing between Skeleton, Muscles, Heart, Lungs, Organs, and more.
// Clicking any bone, muscle, or organ highlights it in cyan glow and displays Uzbek scientific details.
import React, { useState, useMemo } from "react";
import useObjectState from "@/shared/hooks/useObjectState";
import Scene from "@/lab/components/Scene";
import LabWorkspace from "@/lab/components/LabWorkspace";
import AnatomyModel from "./AnatomyModel";
import AnatomyDetailModal from "./AnatomyDetailModal";
import { ANATOMY, ANATOMY_CATEGORIES, getAnatomy } from "@/lab/data/anatomy";

const AnatomyPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { activeSlug, selectedPart, setField, setFields } = useObjectState({
    activeSlug: ANATOMY[0].slug, // Defaults to "skeleton" (Skelet tizimi)
    selectedPart: null,
  });

  const model = getAnatomy(activeSlug);

  // Filter items based on active category
  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return ANATOMY;
    return ANATOMY.filter((a) => a.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <LabWorkspace
      title={model.title}
      description="Modelni sichqoncha bilan aylantiring, yaqinlashtiring. Biror qismni bossangiz, tafsilotlari chiqadi."
      backTo="/biology"
      backLabel="Biologiya"
      items={filteredItems.map((a) => ({ id: a.slug, name: a.title }))}
      activeId={model.slug}
      // Switching system resets the open detail.
      onSelect={(id) => setFields({ activeSlug: id, selectedPart: null })}
      scene={
        <>
          <Scene
            camera={[0, 0.8, 5.5]}
            frameloop="demand"
            controls={{
              enableDamping: true,
              dampingFactor: 0.05,
              minDistance: 0.4,
              maxDistance: 35,
              enablePan: true,
              zoomToCursor: true,
              zoomSpeed: 1.15,
            }}
          >
            {/* High-quality studio lighting */}
            <ambientLight intensity={0.65} />
            <hemisphereLight args={["#ffffff", "#64748b", 0.85]} />
            <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
            <directionalLight position={[-5, 4, -4]} intensity={0.65} />
            <directionalLight position={[0, -5, 2]} intensity={0.35} />

            <AnatomyModel
              key={model.slug}
              url={model.url}
              keepMaterial={!!model.keepMaterial}
              frozen={!!selectedPart}
              onPick={(part) => setField("selectedPart", part)}
            />
          </Scene>

          <AnatomyDetailModal
            part={selectedPart}
            onClose={() => setField("selectedPart", null)}
          />
        </>
      }
      info={
        <div className="space-y-4">
          {/* Category filter pills */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Kategoriyalar
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ANATOMY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/70 hover:bg-secondary text-secondary-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border/60 pt-3">
            <h2 className="text-base font-bold text-foreground">{model.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{model.about}</p>
          </div>
        </div>
      }
    />
  );
};

export default AnatomyPage;
