// Human Atlas statik fayllari (public/models/atlas). Backend emas, shuning
// uchun axios http o'rniga oddiy fetch - baseURL API'ga emas, saytga ishora qiladi.
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { assetUrl } from "../../shared/loaders";

export const ATLAS_MANIFEST_URL = assetUrl("models/atlas/atlas.json");

export const atlasAPI = {
  manifest: (signal) =>
    fetch(ATLAS_MANIFEST_URL, { signal }).then((r) => {
      if (!r.ok) throw new Error("Anatomiya katalogi yuklanmadi.");
      return r.json();
    }),
};

// Chunk .gz bo'lib keladi; host Content-Encoding bilan o'zi ochib bergan bo'lsa
// ikki marta ochmaslik uchun gzip sarlavhasini (1f 8b) tekshiramiz.
export const fetchChunk = async (chunk, signal, onBytes) => {
  const res = await fetch(assetUrl(chunk.url), { signal });
  if (!res.ok) throw new Error("Anatomiya fayli yuklanmadi.");
  let payload;
  if (onBytes && res.body) {
    // Stream so the progress bar moves while a 1 MB chunk is downloading.
    const reader = res.body.getReader();
    const parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.byteLength;
      onBytes(got);
    }
    payload = new Uint8Array(got);
    let off = 0;
    for (const p of parts) {
      payload.set(p, off);
      off += p.byteLength;
    }
    payload = payload.buffer;
  } else {
    payload = await res.arrayBuffer();
  }
  const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const isGzip = sig[0] === 0x1f && sig[1] === 0x8b;
  let buffer = payload;
  if (isGzip) {
    if (typeof DecompressionStream === "undefined")
      throw new Error("Brauzeringiz siqilgan modelni ocha olmaydi. Yangiroq brauzer ishlating.");
    buffer = await new Response(
      new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer();
  }
  if (buffer.byteLength !== chunk.bytes)
    throw new Error("Anatomiya fayli to'liq yuklanmadi. Sahifani yangilang.");
  return buffer;
};

// Encoding v2 (scripts: bio-work/encode_atlas.cjs): meshopt-coded Int16 positions
// (posScale metres per unit), Int16 normals and Uint16 indices per part.
export const isMeshoptAtlas = (atlas) => atlas?.encoding?.codec === "meshopt";

export const decoderReady = () => MeshoptDecoder.ready;

// Returns { position: Float32Array(n*3), normal: Int16Array(n*3), index: Uint16Array|Uint32Array }.
export const decodePart = (buffer, part, atlas) => {
  const vc = part.vertexCount;
  const ic = part.indexCount;
  if (!isMeshoptAtlas(atlas)) {
    return {
      position: new Float32Array(buffer, part.positions, vc * 3),
      normal: new Int16Array(buffer, part.normals, vc * 3),
      index: new Uint32Array(buffer, part.indices, ic),
    };
  }
  const scale = atlas.encoding.posScale;
  const raw = new Uint8Array(buffer);
  const qpos = new Uint8Array(vc * 8);
  MeshoptDecoder.decodeVertexBuffer(qpos, vc, 8, raw.subarray(part.positions, part.positions + part.posBytes));
  const qnrm = new Uint8Array(vc * 8);
  MeshoptDecoder.decodeVertexBuffer(qnrm, vc, 8, raw.subarray(part.normals, part.normals + part.nrmBytes));
  const idx = new Uint8Array(ic * 2);
  MeshoptDecoder.decodeIndexBuffer(idx, ic, 2, raw.subarray(part.indices, part.indices + part.idxBytes));
  const p16 = new Int16Array(qpos.buffer);
  const n16 = new Int16Array(qnrm.buffer);
  const position = new Float32Array(vc * 3);
  const normal = new Int16Array(vc * 3);
  for (let v = 0; v < vc; v++) {
    position[v * 3] = p16[v * 4] * scale;
    position[v * 3 + 1] = p16[v * 4 + 1] * scale;
    position[v * 3 + 2] = p16[v * 4 + 2] * scale;
    normal[v * 3] = n16[v * 4];
    normal[v * 3 + 1] = n16[v * 4 + 1];
    normal[v * 3 + 2] = n16[v * 4 + 2];
  }
  return { position, normal, index: new Uint16Array(idx.buffer) };
};
