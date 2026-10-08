const fs = require('fs');
const path = require('path');
const { createIO, optimizeModel } = require('./compact_models.cjs');

const TARGET_MODELS = [
  "muscles_of_the_orbit_eye.glb",
  "digestive_system.glb",
  "human_diaphragm.glb",
  "human_skeleton.glb",
  "realistic_human_lungs.glb",
  "ecorche_-_anatomy_study.glb",
  "human_liver_and_gallbladder.glb",
  "human_heart_3d_model.glb",
  "human_heart.glb",
  "upper-limb.glb",
  "human_kidney.glb",
  "lower-limb.glb",
  "angiology.glb",
  "neurology.glb",
  "skeleton.glb",
  "hand.glb"
];

async function run() {
  const io = await createIO();
  const dir = path.join(__dirname, '../client/src/shared/assets/models');
  let totalOrig = 0;
  let totalOpt = 0;

  console.log(`Starting batch model compaction for ${TARGET_MODELS.length} heavy 3D assets...`);

  for (const filename of TARGET_MODELS) {
    const fullPath = path.join(dir, filename);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${filename}, skipping...`);
      continue;
    }

    const tempOut = path.join('/tmp', `opt_${filename}`);
    try {
      const res = await optimizeModel(io, fullPath, tempOut, {
        simplifyRatio: 0.38,
        maxTextureSize: 2048,
        compressTextures: true,
      });

      // Atomically replace file with optimized version
      fs.copyFileSync(tempOut, fullPath);
      fs.unlinkSync(tempOut);

      totalOrig += res.original;
      totalOpt += res.optimized;
    } catch (err) {
      console.error(`FAILED optimizing ${filename}:`, err.message);
    }
  }

  const origMB = (totalOrig / 1024 / 1024).toFixed(2);
  const optMB = (totalOpt / 1024 / 1024).toFixed(2);
  const totalPercent = ((1 - totalOpt / totalOrig) * 100).toFixed(1);

  console.log(`\n========================================`);
  console.log(`BATCH COMPACTION COMPLETE!`);
  console.log(`Original total: ${origMB} MB`);
  console.log(`Optimized total: ${optMB} MB`);
  console.log(`Bandwidth / Storage saved: ${(origMB - optMB).toFixed(2)} MB (-${totalPercent}%)`);
  console.log(`========================================\n`);
}

run().catch(err => {
  console.error("Batch error:", err);
  process.exit(1);
});
