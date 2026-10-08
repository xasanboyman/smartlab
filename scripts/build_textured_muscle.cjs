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

const IMAGES_DIR = '/home/xasanboy/Downloads/Skeletal_muscle_structure_(actin_&_myosin)/images';
const RAW_GLB = '/tmp/skeletal-muscle-raw.glb';
const OUTPUT_GLB = '/home/xasanboy/smartlab/client/public/models/skeletal-muscle.glb';

// Mapping from node prefix to texture files
const TEXTURE_MAP = {
  Actin: {
    baseColor: 'T_Actin_M_BaseColor.png',
    normal: 'T_Actin_M_Normal.png',
    metallic: 'T_Actin_M_Metallic.png',
    roughness: 'T_Actin_M_Roughness.png',
  },
  Myosin: {
    baseColor: 'T_Myosin_M_BaseColor.png',
    normal: 'T_Myosin_M_Normal.png',
    metallic: 'T_Myosin_M_Metallic.png',
    roughness: 'T_Myosin_M_Roughness.png',
    occlusion: 'T_Myosin_M_AO.png',
  },
  Myofibril: {
    baseColor: 'T_Myofibril_M_BaseColor.png',
    normal: 'T_Myofibril_M_Normal.png',
    metallic: 'T_Myofibril_M_Metallic.png',
    roughness: 'T_Myofibril_M_Roughness.png',
  },
  Sarcoplasmic_reticulm: {
    baseColor: 'T_Sarcoplasmic_reticulm_M_2_BaseColor.png',
    normal: 'T_Sarcoplasmic_reticulm_M_2_Normal.png',
    metallic: 'T_Sarcoplasmic_reticulm_M_2_Metallic.png',
    roughness: 'T_Sarcoplasmic_reticulm_M_2_Roughness.png',
  },
  Mitochondria: {
    baseColor: 'T_mitochondria_M_2_BaseColor.png',
    normal: 'T_mitochondria_M_2_Normal.png',
    metallic: 'T_mitochondria_M_2_Metallic.png',
    roughness: 'T_mitochondria_M_2_Roughness.png',
    emissive: 'T_mitochondria_M_2_Emissive.png',
    occlusion: 'T_mitochondria_M_2_AO.png',
  },
  Muscle_fiber: {
    baseColor: 'T_Muscle_fiber_M_BaseColor.png',
    normal: 'T_Muscle_fiber_M_Normal.png',
    metallic: 'T_Muscle_fiber_M_Metallic.png',
    roughness: 'T_Muscle_fiber_M_Roughness.png',
    emissive: 'T_Muscle_fiber_M_Emissive.png',
  },
  Muscle_fibers: {
    baseColor: 'T_Muscle_fibers_M_BaseColor.png',
    normal: 'T_Muscle_fibers_M_Normal.png',
    metallic: 'T_Muscle_fibers_M_Metallic.png',
    roughness: 'T_Muscle_fibers_M_Roughness.png',
    emissive: 'T_Muscle_fibers_M_Emissive.png',
  },
  Fascicle: {
    baseColor: 'T_Fascicle_M_2_BaseColor.png',
    normal: 'T_Fascicle_M_2_Normal.png',
    metallic: 'T_Fascicle_M_2_Metallic.png',
    roughness: 'T_Fascicle_M_2_Roughness.png',
  },
  Epimysium: {
    baseColor: 'T_Epimysium_M_BaseColor.png',
    normal: 'T_Epimysium_M_Normal.png',
    metallic: 'T_Epimysium_M_Metallic.png',
    roughness: 'T_Epimysium_M_Roughness.png',
  },
  Perimysium: {
    baseColor: 'T_Perimysium_M_2_BaseColor.png',
    normal: 'T_Perimysium_M_2_Normal.png',
    metallic: 'T_Perimysium_M_2_Metallic.png',
    roughness: 'T_Perimysium_M_2_Roughness.png',
  },
  Muscle: {
    baseColor: 'T_Muscle_M_BaseColor_2.png',
    normal: 'T_Muscle_M_Normal.png',
    metallic: 'T_Muscle_M_Metallic.png',
    roughness: 'T_Muscle_M_Roughness.png',
  },
};

function getGroupKey(nodeName) {
  for (const key of Object.keys(TEXTURE_MAP)) {
    if (nodeName.startsWith(key)) return key;
  }
  return null;
}

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

  console.log('Loading raw GLB...');
  const doc = await io.read(RAW_GLB);
  const root = doc.getRoot();

  // Cache loaded textures
  const textureCache = new Map();

  function loadTexture(filename, name) {
    if (!filename) return null;
    if (textureCache.has(filename)) return textureCache.get(filename);
    const fullPath = path.join(IMAGES_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      console.warn('Texture not found:', fullPath);
      return null;
    }
    const buffer = fs.readFileSync(fullPath);
    const tex = doc.createTexture(name || filename)
      .setImage(buffer)
      .setMimeType('image/png');
    textureCache.set(filename, tex);
    return tex;
  }

  // Create materials for each group
  const materialCache = new Map();

  function getOrCreateMaterial(groupKey) {
    if (materialCache.has(groupKey)) return materialCache.get(groupKey);
    const conf = TEXTURE_MAP[groupKey];
    if (!conf) return null;

    const mat = doc.createMaterial(groupKey + '_Mat')
      .setRoughnessFactor(0.8)
      .setMetallicFactor(0.1);

    if (conf.baseColor) {
      const tex = loadTexture(conf.baseColor, groupKey + '_BaseColor');
      if (tex) mat.setBaseColorTexture(tex);
    }
    if (conf.normal) {
      const tex = loadTexture(conf.normal, groupKey + '_Normal');
      if (tex) mat.setNormalTexture(tex);
    }
    if (conf.occlusion) {
      const tex = loadTexture(conf.occlusion, groupKey + '_AO');
      if (tex) mat.setOcclusionTexture(tex);
    }
    if (conf.emissive) {
      const tex = loadTexture(conf.emissive, groupKey + '_Emissive');
      if (tex) {
        mat.setEmissiveTexture(tex);
        mat.setEmissiveFactor([0.3, 0.3, 0.3]);
      }
    }

    materialCache.set(groupKey, mat);
    return mat;
  }

  console.log('Assigning materials to nodes/meshes...');
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const nodeName = node.getName();
    const groupKey = getGroupKey(nodeName);
    if (!groupKey) {
      console.log('No group key for node:', nodeName);
      continue;
    }

    const mat = getOrCreateMaterial(groupKey);
    mesh.setName(nodeName); // ensure mesh inherits descriptive name
    for (const prim of mesh.listPrimitives()) {
      prim.setMaterial(mat);
    }
    console.log(`Assigned ${groupKey}_Mat to mesh on node ${nodeName}`);
  }

  // Remove unused old materials
  await doc.transform(prune({ keepMaterials: false }));

  console.log('Compacting and converting textures to WebP...');
  await doc.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [1536, 1536],
      quality: 85,
    })
  );

  console.log('Welding and optimizing geometry...');
  await doc.transform(
    weld({ tolerance: 0.0001 }),
    simplify({
      simplifier: meshopt.MeshoptSimplifier,
      ratio: 0.45,
      error: 0.002,
    }),
    reorder({
      encoder: meshopt.MeshoptEncoder,
    }),
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

  console.log('Saving to', OUTPUT_GLB);
  await io.write(OUTPUT_GLB, doc);
  const outStat = fs.statSync(OUTPUT_GLB);
  console.log(`Done! Final model size: ${(outStat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
