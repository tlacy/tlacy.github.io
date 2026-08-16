// reality.js — DroneDeploy reality-capture layer (stubbed).
// Loads simulated as-built observations and computes plan-vs-as-built deltas.
// The connector seam below is where a real DroneDeploy API client would return
// georeferenced progress aligned to the model CRS (IfcMapConversion / IfcProjectedCRS).

export async function loadReality(url = "./data/reality.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load reality capture: " + res.status);
  return res.json();
}

// computeRealityDelta(reality) -> { source, note, findings:[{area,planned,asBuilt,gap,note}] }
export function computeRealityDelta(reality) {
  const findings = (reality.observations || [])
    .filter((o) => typeof o.asBuilt === "number" && o.asBuilt < o.planned)
    .map((o) => ({
      area: o.area,
      planned: o.planned,
      asBuilt: o.asBuilt,
      gap: Math.round((o.planned - o.asBuilt) * 100),
      note: o.note || ""
    }));
  return { source: reality.source, note: reality.note, findings };
}
