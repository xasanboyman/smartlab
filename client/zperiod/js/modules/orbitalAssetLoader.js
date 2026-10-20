// =============================================================================
// Orbital Asset Loader — loads precomputed quantum orbital datasets
// =============================================================================

let manifestPromise = null;
const assetCache = new Map();

async function decodeOrbitalResponse(resp) {
  try {
    const clone = resp.clone();
    try {
      return await clone.json();
    } catch (_) {
      // not yet decompressed, continue
    }
  } catch (_) {}

  const buf = new Uint8Array(await resp.arrayBuffer());
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    if (typeof DecompressionStream !== "undefined") {
      const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).json();
    }
    throw new Error("This browser does not support DecompressionStream for orbitals.");
  }
  return JSON.parse(new TextDecoder().decode(buf));
}

export async function getOrbitalManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch("/orbitals/manifest.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("Orbital manifest could not be loaded");
        return r.json();
      })
      .catch((err) => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

export async function loadOrbitalAsset(name) {
  if (!assetCache.has(name)) {
    const task = (async () => {
      const manifest = await getOrbitalManifest();
      const file = manifest.orbitals?.[name];
      if (!file) throw new Error(`Unknown orbital asset: ${name}`);
      const res = await fetch(`/orbitals/${file}`, { cache: "force-cache" });
      if (!res.ok) throw new Error(`Orbital asset ${name} could not be loaded.`);
      return decodeOrbitalResponse(res);
    })();
    assetCache.set(name, task);
    task.catch(() => {
      if (assetCache.get(name) === task) assetCache.delete(name);
    });
  }
  return assetCache.get(name);
}

export async function loadSelectedOrbitals(names) {
  const unique = [...new Set(names)].filter(Boolean);
  const results = await Promise.all(unique.map((n) => loadOrbitalAsset(n)));
  return Object.fromEntries(unique.map((n, i) => [n, results[i]]));
}

export async function loadAllOrbitals() {
  const manifest = await getOrbitalManifest();
  return loadSelectedOrbitals(Object.keys(manifest.orbitals || {}));
}
