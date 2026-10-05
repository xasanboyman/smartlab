import React from "react";
import Shatter from "@/shared/components/canvas-ui/Shatter";

/**
 * ShatterCard — Interactive Glass Shatter & Heal Card.
 * Powered by CanvasUI Shatter (WebGL 3D glass shard simulation).
 * Shards lift, tilt, and refract light around the cursor, inspired by Zyie's PixiJS HTML Laser / Shatter demo.
 */
export const ShatterCard = ({
  children,
  className = "",
  radius = 0.35,
  tileSize = 32,
  shards = 0.85,
  lift = 28,
  tilt = 1.2,
  refraction = 0.9,
  dispersion = 0.5,
  style = {},
}) => {
  return (
    <Shatter
      radius={radius}
      tileSize={tileSize}
      shards={shards}
      lift={lift}
      tilt={tilt}
      refraction={refraction}
      dispersion={dispersion}
      className={className}
      style={style}
    >
      {children}
    </Shatter>
  );
};

export default ShatterCard;
