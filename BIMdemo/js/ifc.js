// ifc.js — parse an IFC (OpenBIM, ISO 16739) model entirely in the browser with web-ifc (WASM).
// No server needed: the semantic model is read client-side, which is the whole point of the
// "reason over the model, not the document" thesis.
import * as WebIFC from "https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/web-ifc-api.js";

let _api = null;
async function getApi() {
  if (_api) return _api;
  _api = new WebIFC.IfcAPI();
  _api.SetWasmPath("https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/");
  await _api.Init();
  return _api;
}

// Warm the WASM engine ahead of first use so the first parse feels instant.
export async function warmEngine() {
  await getApi();
}

// Element types we surface for IDS checks (present in typical architectural models).
const TYPES = [
  "IFCDOOR", "IFCWINDOW", "IFCWALLSTANDARDCASE", "IFCWALL",
  "IFCSLAB", "IFCROOF", "IFCFOOTING", "IFCSTAIRFLIGHT"
];

function valueOf(x) {
  return x && typeof x === "object" && "value" in x ? x.value : x;
}

// Build a map of expressID -> { propertyName: value } by traversing
// IfcRelDefinesByProperties -> IfcPropertySet -> IfcPropertySingleValue.
// (Manual traversal is robust across web-ifc versions.)
function buildPsetMap(api, modelID) {
  const map = {};
  const rels = api.GetLineIDsWithType(modelID, WebIFC.IFCRELDEFINESBYPROPERTIES);
  for (let i = 0; i < rels.size(); i++) {
    let rel;
    try { rel = api.GetLine(modelID, rels.get(i)); } catch { continue; }
    const defRef = rel.RelatingPropertyDefinition;
    const defId = defRef && defRef.value;
    if (!defId) continue;

    let pset;
    try { pset = api.GetLine(modelID, defId); } catch { continue; }
    if (!pset || !pset.HasProperties) continue;

    const props = {};
    const hp = Array.isArray(pset.HasProperties) ? pset.HasProperties : [pset.HasProperties];
    for (const pref of hp) {
      const pid = pref && pref.value;
      if (pid === undefined) continue;
      let p;
      try { p = api.GetLine(modelID, pid); } catch { continue; }
      const pname = valueOf(p.Name);
      const pval = p.NominalValue !== undefined ? valueOf(p.NominalValue) : undefined;
      if (pname) props[pname] = pval;
    }

    const related = rel.RelatedObjects || [];
    const rr = Array.isArray(related) ? related : [related];
    for (const o of rr) {
      const oid = o && o.value;
      if (oid !== undefined) map[oid] = Object.assign(map[oid] || {}, props);
    }
  }
  return map;
}

// Parse the IFC bytes -> { elements:[{type,expressID,globalId,name,props}], summary }
export async function parseIfc(uint8, modelName = "model.ifc") {
  const api = await getApi();
  const modelID = api.OpenModel(uint8);
  const psetMap = buildPsetMap(api, modelID);

  const elements = [];
  for (const t of TYPES) {
    const code = WebIFC[t];
    if (code === undefined) continue;
    const ids = api.GetLineIDsWithType(modelID, code);
    for (let i = 0; i < ids.size(); i++) {
      const eid = ids.get(i);
      let line;
      try { line = api.GetLine(modelID, eid); } catch { continue; }
      elements.push({
        type: t,
        expressID: eid,
        globalId: valueOf(line.GlobalId),
        name: valueOf(line.Name),
        props: psetMap[eid] || {}
      });
    }
  }

  const summary = {
    name: modelName,
    elementCount: elements.length,
    typeCount: new Set(elements.map((e) => e.type)).size,
    propertySetCount: Object.keys(psetMap).length
  };

  api.CloseModel(modelID);
  return { elements, summary };
}
