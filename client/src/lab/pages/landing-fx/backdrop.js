// The "render pipeline" page that shows through the holes the laser cuts into the landing page.
// Static HTML captured once; system fonts only, so it also survives the no-flag path.
export const backdropHtml = `
<div style="position:absolute;inset:0;background:#050810;color:#9fe7dc;font-family:ui-monospace,'DejaVu Sans Mono',Menlo,monospace;overflow:hidden;
  background-image:linear-gradient(rgba(56,224,200,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(56,224,200,.08) 1px,transparent 1px);background-size:40px 40px;">
  <div style="position:absolute;inset:0;background:radial-gradient(900px 500px at 70% 20%,rgba(91,140,255,.18),transparent 60%),radial-gradient(700px 500px at 10% 80%,rgba(56,224,200,.14),transparent 55%);"></div>
  <div style="position:absolute;left:6%;top:10%;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:rgba(159,231,220,.6);">simulink // render pipeline</div>
  <div style="position:absolute;left:6%;top:14%;font-size:clamp(28px,5vw,64px);font-weight:800;letter-spacing:-.03em;color:#e8eefc;line-height:1;">DOM → paint → <span style="color:#38e0c8">texElementImage2D</span> → WebGL</div>
  <div style="position:absolute;left:6%;top:30%;display:grid;grid-template-columns:repeat(4,minmax(140px,200px));gap:18px;">
    ${["<b>1 · layoutsubtree</b><span>canvas o'z farzandlarini joylashtiradi</span>", "<b>2 · paint</b><span>har kadrda snapshot olinadi</span>", "<b>3 · HTMLSource</b><span>PixiJS tekstura manbai</span>", "<b>4 · chunk sprites</b><span>22px bo'laklar, lazer kesadi</span>"]
      .map((t) => `<div style="border:1px solid rgba(56,224,200,.35);border-radius:10px;padding:14px;background:rgba(5,8,16,.7);display:flex;flex-direction:column;gap:6px;font-size:12px;color:rgba(232,238,252,.7);">${t}</div>`)
      .join("")}
  </div>
  <div style="position:absolute;left:6%;top:52%;font-size:13px;line-height:1.7;color:rgba(232,238,252,.55);max-width:560px;">
    Bu sahifa jonli: matnni belgilang, havolalarni bosing, aylantiring — brauzer uni hali ham DOM sifatida ko'radi. Pixi esa piksellarini WebGL'ga ko'chiradi.
  </div>
  <div style="position:absolute;right:6%;bottom:8%;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:rgba(159,231,220,.5);">chrome://flags/#canvas-draw-element</div>
  <div style="position:absolute;right:8%;top:16%;width:260px;height:260px;border:1px dashed rgba(91,140,255,.5);border-radius:50%;"></div>
  <div style="position:absolute;right:12%;top:22%;width:160px;height:160px;border:1px dashed rgba(56,224,200,.5);border-radius:50%;"></div>
</div>`;
