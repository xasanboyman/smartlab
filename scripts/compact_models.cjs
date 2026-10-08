const fs = require('fs');
const path = require('path');
const { NodeIO } = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/@gltf-transform/core');
const { ALL_EXTENSIONS } = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/@gltf-transform/extensions');
const {
  weld,
  simplify,
  reorder,
  prune,
  draco,
  dedup,
  metalRough,
  textureCompress,
} = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/@gltf-transform/functions');
const draco3d = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/draco3dgltf');
const meshopt = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/meshoptimizer');
const sharp = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/sharp');

async function createIO() {
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.decoder': meshopt.MeshoptDecoder,
      'meshopt.simplifier': meshopt.MeshoptSimplifier,
      'meshopt.encoder': meshopt.MeshoptEncoder,
    });
}

async function optimizeModel(io, inputPath, outputPath, options = {}) {
  const {
    simplifyRatio = 0.35,
    maxTextureSize = 2048,
    compressTextures = true,
  } = options;

  const statOrig = fs.statSync(inputPath);
  const sizeMB = (statOrig.size / 1024 / 1024).toFixed(2);
  console.log(`\n========================================`);
  console.log(`Compacting: ${path.basename(inputPath)} (${sizeMB} MB)`);

  const doc = await io.read(inputPath);

  // 1. Convert legacy specular/glossiness to metalRough PBR
  try {
    await doc.transform(metalRough());
  } catch (err) {
    // Ignore if not present
  }

  // 2. Texture compression: downscale oversized textures and encode as WebP
  if (compressTextures) {
    const textures = doc.getRoot().listTextures();
    if (textures.length > 0) {
      console.log(`Processing ${textures.length} textures (WebP conversion & max ${maxTextureSize}px)...`);
      try {
        await doc.transform(
          textureCompress({
            encoder: sharp,
            targetFormat: 'webp',
            resize: [maxTextureSize, maxTextureSize],
          })
        );
      } catch (texErr) {
        console.warn(`Texture compression warning: ${texErr.message}`);
      }
    }
  }

  // 3. Strip unused COLOR_0 attributes to free VRAM
  let strippedColor = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getAttribute('COLOR_0')) {
        prim.setAttribute('COLOR_0', null);
        strippedColor++;
      }
    }
  }
  if (strippedColor > 0) {
    console.log(`Stripped COLOR_0 from ${strippedColor} primitives`);
  }

  // 4. Weld duplicate vertices
  console.log(`Welding vertices...`);
  await doc.transform(weld({ tolerance: 0.0001 }));

  // 5. Simplify geometry with meshoptimizer
  if (simplifyRatio < 1.0) {
    console.log(`Simplifying geometry (target ratio: ${simplifyRatio})...`);
    await doc.transform(
      simplify({
        simplifier: meshopt.MeshoptSimplifier,
        ratio: simplifyRatio,
        error: 0.002,
      })
    );
  }

  // 6. Reorder vertices for GPU cache
  console.log(`Reordering vertices for GPU vertex cache...`);
  await doc.transform(reorder({ encoder: meshopt.MeshoptEncoder }));

  // 7. Dedup and prune orphaned properties
  console.log(`Deduplicating and pruning unused accessors...`);
  await doc.transform(dedup(), prune());

  // 8. Draco compress
  console.log(`Applying Draco compression...`);
  await doc.transform(
    draco({
      method: 'edgebreaker',
      encodeSpeed: 5,
      decodeSpeed: 5,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    })
  );

  await io.write(outputPath, doc);
  const statOpt = fs.statSync(outputPath);
  const optMB = (statOpt.size / 1024 / 1024).toFixed(2);
  const percentSaved = ((1 - statOpt.size / statOrig.size) * 100).toFixed(1);
  console.log(`SUCCESS: ${path.basename(outputPath)} -> ${optMB} MB (-${percentSaved}%)`);
  return { original: statOrig.size, optimized: statOpt.size };
}

module.exports = { createIO, optimizeModel };
