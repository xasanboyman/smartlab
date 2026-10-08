const fs = require('fs');
const path = require('path');

const { NodeIO } = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/@gltf-transform/core');
const { ALL_EXTENSIONS } = require('/home/xasanboy/.npm/_npx/a6797f7ff67bb1f2/node_modules/@gltf-transform/extensions');
const {
  weld,
  reorder,
  draco,
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

  // 1. Reset Sketchfab_model artificial offset transform so world coordinates exactly match Sketchfab database
  for (const node of root.listNodes()) {
    if (node.getName() === 'Sketchfab_model') {
      node.setTranslation([0, 0, 0]);
      node.setRotation([0, 0, 0, 1]);
      console.log('Reset Sketchfab_model transform to identity (world alignment)!');
    }
  }

  // 2. High-performance texture optimization (reducing uncompressed GPU RAM from 450 MB down to < 60 MB)
  console.log('Compressing textures intelligently with Sharp WebP...');
  for (const texture of root.listTextures()) {
    const name = (texture.getName() || '').toLowerCase();
    const uri = (texture.getURI() || '').toLowerCase();
    const isNormalOrBase = name.includes('basecolor') || name.includes('normal') || uri.includes('basecolor') || uri.includes('normal');
    // BaseColor and Normal get 1024; Metallic, Roughness, AO, Emissive get 512
    const maxSize = isNormalOrBase ? 1024 : 512;
    const imgBuffer = texture.getImage();
    if (imgBuffer) {
      const metadata = await sharp(imgBuffer).metadata();
      const newWidth = Math.min(metadata.width || maxSize, maxSize);
      const newHeight = Math.min(metadata.height || maxSize, maxSize);
      const compressed = await sharp(imgBuffer)
        .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      texture.setImage(compressed);
      texture.setMimeType('image/webp');
      console.log(`  -> ${texture.getName()} (${newWidth}x${newHeight} WebP)`);
    }
  }

  // 3. Weld vertices and apply Draco compression
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
  console.log(`Successfully generated optimized skeletal-muscle.glb! Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
