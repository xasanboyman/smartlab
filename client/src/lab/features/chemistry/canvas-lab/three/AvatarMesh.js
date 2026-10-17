import * as THREE from "three";

/**
 * 3D Procedural Avatar Figure
 * Modeled after the character shown in arrival.space/htmlcanvas
 * (Hoodie with graffiti/doodle print, dark pants, sneakers, lab ID lanyard)
 */
export function createAvatar3D() {
  const group = new THREE.Group();
  group.name = "ScientistAvatar";

  // Hoodie Doodle Texture
  const doodleCanvas = document.createElement("canvas");
  doodleCanvas.width = 512;
  doodleCanvas.height = 512;
  const dctx = doodleCanvas.getContext("2d");

  // Colorful graffiti doodle background
  dctx.fillStyle = "#f5f6fa";
  dctx.fillRect(0, 0, 512, 512);

  const colors = ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#9b59b6"];
  for (let i = 0; i < 40; i++) {
    dctx.fillStyle = colors[i % colors.length];
    dctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 8 + Math.random() * 22;
    if (i % 3 === 0) {
      dctx.arc(x, y, r, 0, Math.PI * 2);
      dctx.fill();
    } else {
      dctx.font = "bold 24px sans-serif";
      dctx.fillText("🧪", x, y);
    }
  }
  const hoodieTex = new THREE.CanvasTexture(doodleCanvas);
  hoodieTex.wrapS = THREE.RepeatWrapping;
  hoodieTex.wrapT = THREE.RepeatWrapping;

  const hoodieMat = new THREE.MeshStandardMaterial({
    map: hoodieTex,
    roughness: 0.8,
    metalness: 0.05,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffd2b3,
    roughness: 0.6,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0xe6bf70, // Blonde hair
    roughness: 0.5,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1e272e, // Dark baggy pants
    roughness: 0.75,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.4,
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  });

  // 1. Torso (Hoodie Body)
  const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.75, 16);
  const torso = new THREE.Mesh(torsoGeo, hoodieMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  group.add(torso);

  // Hoodie Pocket
  const pocketGeo = new THREE.BoxGeometry(0.36, 0.18, 0.08);
  const pocket = new THREE.Mesh(pocketGeo, hoodieMat);
  pocket.position.set(0, 1.15, 0.22);
  group.add(pocket);

  // 2. Head & Neck
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.14, 16);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 1.78;
  group.add(neck);

  const headGeo = new THREE.SphereGeometry(0.22, 24, 24);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.98;
  head.castShadow = true;
  group.add(head);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.23, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 2.01, -0.02);
  hair.scale.set(1.02, 1.05, 1.08);
  group.add(hair);

  // Hair fringe/bangs
  const fringeGeo = new THREE.BoxGeometry(0.24, 0.1, 0.08);
  const fringe = new THREE.Mesh(fringeGeo, hairMat);
  fringe.position.set(0, 2.12, 0.17);
  fringe.rotation.x = 0.25;
  group.add(fringe);

  // 3. Arms & Hands
  const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.65, 16);
  const armL = new THREE.Mesh(armGeo, hoodieMat);
  armL.position.set(-0.42, 1.32, 0.02);
  armL.rotation.z = 0.18;
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, hoodieMat);
  armR.position.set(0.42, 1.32, 0.02);
  armR.rotation.z = -0.18;
  armR.castShadow = true;
  group.add(armL, armR);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.075, 16, 16);
  const handL = new THREE.Mesh(handGeo, skinMat);
  handL.position.set(-0.48, 0.95, 0.02);
  const handR = new THREE.Mesh(handGeo, skinMat);
  handR.position.set(0.48, 0.95, 0.02);
  group.add(handL, handR);

  // 4. Legs (Dark Baggy Trousers)
  const legGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.85, 16);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.16, 0.55, 0);
  legL.castShadow = true;

  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.16, 0.55, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // 5. Sneakers (Black with white laces & sole)
  const shoeGeo = new THREE.BoxGeometry(0.17, 0.13, 0.32);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.16, 0.07, 0.05);
  shoeL.castShadow = true;

  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0.16, 0.07, 0.05);
  shoeR.castShadow = true;

  // White soles
  const soleGeo = new THREE.BoxGeometry(0.18, 0.035, 0.33);
  const soleL = new THREE.Mesh(soleGeo, whiteMat);
  soleL.position.set(-0.16, 0.02, 0.05);
  const soleR = new THREE.Mesh(soleGeo, whiteMat);
  soleR.position.set(0.16, 0.02, 0.05);

  group.add(shoeL, shoeR, soleL, soleR);

  group.userData = {
    animate(time) {
      // Idle breathing and subtle head bob
      const breath = Math.sin(time * 2.0) * 0.015;
      torso.scale.set(1 + breath * 0.6, 1 + breath, 1 + breath * 0.6);
      head.position.y = 1.98 + breath * 0.8;
      hair.position.y = 2.01 + breath * 0.8;
      fringe.position.y = 2.12 + breath * 0.8;

      armL.rotation.z = 0.18 + Math.sin(time * 1.8) * 0.03;
      armR.rotation.z = -0.18 - Math.sin(time * 1.8) * 0.03;
    },
  };

  return group;
}
