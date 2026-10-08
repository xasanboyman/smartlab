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

const INPUT_GLTF = '/home/xasanboy/Downloads/Skeletal_muscle_structure_(actin_&_myosin).gltf';
const OUTPUT_GLB = '/home/xasanboy/smartlab/client/public/models/skeletal-muscle.glb';

async function main() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.decoder': meshopt.MeshoptDecoder,
      'meshopt.simplifier': meshopt.MeshoptSimplifier,
      'meshopt.encoder': meshopt.MeshoptEncoder,
    });

  console.log('Loading official Sketchfab glTF...');
  const doc = await io.read(INPUT_GLTF);
  const root = doc.getRoot();

  console.log(`Document loaded with ${root.listMaterials().length} materials and ${root.listTextures().length} textures.`);

  // Compress textures to WebP (max 2048)
  console.log('Compressing textures to WebP...');
  await doc.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [2048, 2048],
      quality: 85,
    })
  );

  // Weld and draco compress
  console.log('Welding vertices and applying Draco compression...');
  await doc.transform(
    weld({ tolerance: 0.0001 }),
    reorder({ encoder: meshopt.MeshoptEncoder }),
    draco({
      method: 'edgebreaker',
      encodeSpeed: 5,
      decodeSpeed: 5,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeGeneric: 10,
    })
  );

  console.log('Writing to', OUTPUT_GLB);
  await io.write(OUTPUT_GLB, doc);
  const stat = fs.statSync(OUTPUT_GLB);
  console.log(`Successfully generated official skeletal-muscle.glb! Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
