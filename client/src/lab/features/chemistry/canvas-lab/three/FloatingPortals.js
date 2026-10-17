import * as THREE from "three";

/**
 * 3D Floating Portal Frames
 * Modeled after the futuristic portal gates in arrival.space/htmlcanvas
 * (White rounded beveled frames, glowing inner ambient light, and interactive canvas screens)
 */

function createPortalTexture(title, subtitle, icon, colorHex = "#00f0ff") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 768;
  const ctx = c.getContext("2d");

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, 768);
  grad.addColorStop(0, "#0e1322");
  grad.addColorStop(0.5, "#18223d");
  grad.addColorStop(1, "#0a0d18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  // Hexagon/grid overlay
  ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
  ctx.lineWidth = 2;
  for (let y = 0; y < 768; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Neon glowing inner frame
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 452, 708);

  // Icon circle
  ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
  ctx.beginPath();
  ctx.arc(256, 260, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Big Emoji/Icon
  ctx.font = "90px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, 256, 260);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(title, 256, 450);

  // Subtitle
  ctx.fillStyle = "#94a3b8";
  ctx.font = "24px monospace";
  ctx.fillText(subtitle, 256, 510);

  // Pill badge button
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.roundRect(136, 590, 240, 60, [30]);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = "bold 26px system-ui";
  ctx.fillText("OCHISH →", 256, 628);

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function createPortalGate3D(title, subtitle, icon, colorHex = "#00f0ff") {
  const group = new THREE.Group();
  group.name = `Portal_${title}`;

  const frameW = 1.35;
  const frameH = 2.0;
  const frameD = 0.28;

  // Frame Material: Sleek off-white polymer/ceramic like in screenshot
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xedf1f5,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Rounded outer frame constructed with 4 border boxes
  const borderThickness = 0.12;

  // Top & bottom
  const tbGeo = new THREE.BoxGeometry(frameW, borderThickness, frameD);
  const topMesh = new THREE.Mesh(tbGeo, frameMat);
  topMesh.position.y = frameH / 2 - borderThickness / 2;
  const bottomMesh = new THREE.Mesh(tbGeo, frameMat);
  bottomMesh.position.y = -frameH / 2 + borderThickness / 2;
  group.add(topMesh, bottomMesh);

  // Left & right
  const lrGeo = new THREE.BoxGeometry(borderThickness, frameH - borderThickness * 2, frameD);
  const leftMesh = new THREE.Mesh(lrGeo, frameMat);
  leftMesh.position.x = -frameW / 2 + borderThickness / 2;
  const rightMesh = new THREE.Mesh(lrGeo, frameMat);
  rightMesh.position.x = frameW / 2 - borderThickness / 2;
  group.add(leftMesh, rightMesh);

  // Inner Screen Plane
  const screenGeo = new THREE.PlaneGeometry(frameW - borderThickness * 2, frameH - borderThickness * 2);
  const screenMat = new THREE.MeshBasicMaterial({
    map: createPortalTexture(title, subtitle, icon, colorHex),
    side: THREE.DoubleSide,
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.z = 0;
  group.add(screenMesh);

  // Glowing neon inner rim
  const rimMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.65,
  });
  const rimGeo = new THREE.BoxGeometry(frameW - 0.04, frameH - 0.04, 0.02);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.z = 0.06;
  group.add(rimMesh);

  // Subtle hover floating animation
  const initialY = 1.6;
  group.position.y = initialY;

  group.userData = {
    title,
    initialY,
    animate(time, offset = 0) {
      group.position.y = initialY + Math.sin(time * 1.5 + offset) * 0.06;
    },
  };

  return group;
}
