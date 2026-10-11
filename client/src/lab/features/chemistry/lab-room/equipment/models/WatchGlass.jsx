import { useMemo } from "react";
import { useKit } from "../kit/kitContext";
import GlassVessel from "../kit/GlassVessel";
import Contents from "../kit/Contents";
import BlobShadow from "../kit/BlobShadow";
import { arc, buildVessel, radiusAt } from "../kit/vessel";

// 90 mm borosilicate watch glass: concave dish, Ø90 mm, 12 mm height, 1.6 mm glass wall.
const RADIUS = 0.045;
const HEIGHT = 0.014;
const WALL = 0.0016;
const BOTTOM = 0.002;
const FILLET = 0.003;

const OUTLINE = [
  [0, 0],
  ...arc(0.01, 0.002, 0.002, -Math.PI / 2, 0, 4),
  [0.025, 0.004],
  [0.038, 0.008],
  [RADIUS - FILLET, HEIGHT - FILLET],
  ...arc(RADIUS - FILLET, HEIGHT - FILLET, FILLET, 0, Math.PI / 2, 4),
];

let assets = null;
const getAssets = () => {
  if (assets) return assets;
  const vessel = buildVessel({
    outline: OUTLINE,
    wall: WALL,
    bottom: BOTTOM,
    segments: 64,
  });
  const mouth = {
    innerProfile: vessel.innerProfile,
    capacityMl: 30,
    mouthY: vessel.rimY,
    mouthR: radiusAt(vessel.innerProfile, vessel.rimY),
  };
  assets = { vessel, mouth };
  return assets;
};

const WatchGlass = ({ simId, volumeMl = 0, liquidColor, liquidOpacity, ...props }) => {
  const kit = useKit();
  const { vessel, mouth } = useMemo(() => getAssets(), []);

  return (
    <group {...props}>
      <BlobShadow radius={RADIUS * 1.05} opacity={0.35} />
      <GlassVessel geometry={vessel.geometry} renderOrder={kit.renderOrder} />
      {simId && (
        <Contents
          simId={simId}
          mouth={mouth}
          vesselInnerProfile={vessel.innerProfile}
          nominalVolumeMl={30}
          liquidColor={liquidColor}
          liquidOpacity={liquidOpacity}
        />
      )}
    </group>
  );
};

export default WatchGlass;
