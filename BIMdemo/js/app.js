// app.js — orchestrates the Plan -> Reality -> Intelligence loop.
import { parseIfc, warmEngine } from "./ifc.js";
import { runIdsChecks } from "./ids.js";
import { loadReality, computeRealityDelta } from "./reality.js";
import { summarizeFindings } from "./ai.js";
import { buildBcfBlob, downloadBlob } from "./bcf.js";

// Local AI proxy endpoint (provider-swappable: Bedrock / DataGrid / local — chosen server-side).
// Only used when the "Use real AI" box is checked AND the demo runs on localhost.
const AI_ENDPOINT =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:8790/api/analyze"
    : "";

const SAMPLE_URL = "./sample/IfcOpenHouse.ifc";

const state = {
  model: null,
  elements: [],
  geometry: [],
  idsFindings: [],
  realityFindings: [],
  issues: [],
  viewerReady: false
};

const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hide");

function pill(status) {
  const cls = status === "pass" ? "ok" : status === "fail" ? "fail" : "warn";
  return `<span class="pill ${cls}">${status}</span>`;
}

// ---- 3D viewer (dynamic import so a Three.js failure never breaks the core loop) ----
let _viewer = null;
let _viewerTried = false;
async function ensureViewer() {
  if (_viewer || _viewerTried) return _viewer;
  _viewerTried = true;
  try { _viewer = await import("./viewer.js"); }
  catch (e) { console.warn("[app] 3D viewer unavailable:", e); _viewer = null; }
  return _viewer;
}

function onModelPick(eid) {
  const fs = state.idsFindings.filter((f) => f.expressID === eid);
  const fails = fs.filter((f) => f.status === "fail");
  const name = (fs[0] && fs[0].name) || "element";
  $("viewerCap").innerHTML = fails.length
    ? `Selected <strong>${name}</strong> — ${fails.length} failing check(s): ${fails.map((f) => f.ruleTitle.split("—")[0].trim()).join(", ")}.`
    : `Selected <strong>${name}</strong>.`;
}

// ---- STEP 1: PLAN ----
async function loadModelFromBytes(bytes, name) {
  $("modelOut").innerHTML = `<p class="muted"><span class="spinner"></span>Parsing ${name}…</p>`;
  show($("modelOut"));
  const { elements, summary, geometry } = await parseIfc(bytes, name);
  state.elements = elements;
  state.model = summary;
  state.geometry = geometry || [];

  const byType = {};
  for (const e of elements) byType[e.type] = (byType[e.type] || 0) + 1;
  const rows = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `<tr><td>${t}</td><td>${n}</td></tr>`)
    .join("");

  $("modelOut").innerHTML = `
    <p><strong>${summary.name}</strong> — ${summary.elementCount} elements ·
       ${summary.typeCount} types · ${summary.propertySetCount} property set(s).</p>
    <table><thead><tr><th>Element type</th><th>Count</th></tr></thead><tbody>${rows}</tbody></table>`;
  $("btnIds").disabled = false;

  // 3D viewer (additive; guarded so it can never break the core loop).
  // If WebGL is unavailable (e.g. an embedded/sandboxed browser with hardware
  // acceleration off), show a visible, actionable message instead of an empty box.
  try {
    const v = await ensureViewer();
    if (v && state.geometry.length) {
      v.initViewer($("viewer"));      // throws if a WebGL context can't be created
      v.loadModel(state.geometry);
      v.onPick(onModelPick);
      show($("viewer")); show($("viewerCap"));
      state.viewerReady = true;
    }
  } catch (e) {
    console.warn("[app] viewer init skipped:", e);
    state.viewerReady = false;
    $("viewer").classList.add("hide");
    const cap = $("viewerCap");
    if (cap) {
      cap.classList.remove("hide");
      cap.innerHTML = `<span class="pill warn">3D preview unavailable</span> This browser has WebGL / hardware acceleration disabled (common in embedded browsers). Open this page in <strong>Chrome or Firefox</strong> with hardware acceleration on to see the model. IDS, reality, AI, and the BCF export all work without it.`;
    }
  }
}

$("btnSample").addEventListener("click", async () => {
  try {
    $("btnSample").disabled = true;
    $("btnSample").textContent = "Loading…";
    const res = await fetch(SAMPLE_URL);
    const buf = new Uint8Array(await res.arrayBuffer());
    await loadModelFromBytes(buf, "IfcOpenHouse (IFC4)");
  } catch (e) {
    $("modelOut").innerHTML = `<p class="pill fail">Failed to load sample: ${e.message}</p>`;
  } finally {
    $("btnSample").disabled = false;
    $("btnSample").textContent = "Load sample model";
  }
});

// ---- STEP 2: IDS ----
$("btnIds").addEventListener("click", async () => {
  const findings = runIdsChecks(state.elements);
  state.idsFindings = findings;

  const passes = findings.filter((f) => f.status === "pass").length;
  const rows = findings
    .map((f) => `<tr class="idsrow" data-eid="${f.expressID}" style="cursor:pointer"><td>${pill(f.status)}</td><td>${f.ruleTitle}</td><td>${f.name}</td>
                 <td class="muted">${f.requirement}</td>
                 <td class="muted">${f.observed ?? "—"}</td></tr>`)
    .join("");

  $("idsOut").innerHTML = `
    <p>${passes}/${findings.length} checks passing. <span class="muted">${state.viewerReady ? "Failing elements are red in the 3D view — click a row to fly to it." : "Enable WebGL (Chrome/Firefox) to see failing elements highlighted in 3D."}</span></p>
    <table><thead><tr><th></th><th>Requirement</th><th>Element</th><th>Needs</th><th>Observed</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  show($("idsOut"));
  $("btnReality").disabled = false;

  // Highlight failing elements in 3D + wire row-click -> fly-to.
  const failEIDs = findings.filter((f) => f.status === "fail").map((f) => f.expressID).filter((x) => x !== undefined);
  try {
    const v = await ensureViewer();
    if (v) {
      v.highlightFailing(failEIDs);
      document.querySelectorAll(".idsrow").forEach((row) =>
        row.addEventListener("click", () => v.focusElement(Number(row.dataset.eid))));
    }
  } catch (e) { console.warn("[app] highlight skipped:", e); }
});

// ---- STEP 3: REALITY ----
$("btnReality").addEventListener("click", async () => {
  try {
    const reality = await loadReality();
    const delta = computeRealityDelta(reality);
    state.realityFindings = delta.findings;

    const rows = delta.findings
      .map((r) => `<tr><td>${r.area}</td><td>${Math.round(r.planned * 100)}%</td>
                   <td>${Math.round(r.asBuilt * 100)}%</td><td>${pill("fail")} −${r.gap}%</td>
                   <td class="muted">${r.note}</td></tr>`)
      .join("");

    $("realityOut").innerHTML = `
      <p class="muted stub">${delta.source} — ${delta.note}</p>
      <table><thead><tr><th>Area</th><th>Planned</th><th>As-built</th><th>Gap</th><th>Note</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
    show($("realityOut"));
    $("btnAi").disabled = false;
  } catch (e) {
    $("realityOut").innerHTML = `<p class="pill fail">${e.message}</p>`;
    show($("realityOut"));
  }
});

// ---- STEP 4: INTELLIGENCE ----
$("btnAi").addEventListener("click", async () => {
  $("btnAi").disabled = true;
  $("aiOut").innerHTML = `<p class="muted"><span class="spinner"></span>Analyzing…</p>`;
  show($("aiOut"));

  const payload = {
    model: state.model,
    idsFindings: state.idsFindings,
    realityFindings: state.realityFindings
  };

  let result, label;
  try {
    if (AI_ENDPOINT) {
      // Default to real AI via the local proxy; fall back to the grounded local
      // summary if the proxy isn't running (e.g., on the hosted static site).
      try {
        result = await summarizeFindings(payload, { mode: "datagrid", endpoint: AI_ENDPOINT });
        label = `Real AI${result.provider ? " — " + result.provider : ""}`;
      } catch {
        result = await summarizeFindings(payload, { mode: "local" });
        label = "Local grounded summary (real-AI proxy not running)";
      }
    } else {
      result = await summarizeFindings(payload, { mode: "local" });
      label = "Local grounded summary";
    }
    const { summary, issues } = result;
    state.issues = issues;
    $("aiOut").innerHTML = `
      <p class="muted">${label}:</p>
      <pre>${summary.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</pre>`;
    renderIssues(issues);
    $("btnBcf").disabled = false;
    $("btnWriteback").disabled = false;
  } catch (e) {
    $("aiOut").innerHTML = `<p class="pill fail">${e.message}</p>`;
  } finally {
    $("btnAi").disabled = false;
  }
});

function renderIssues(issues) {
  const html = issues
    .map(
      (iss, i) => `<div class="issue"><label>
        <input type="checkbox" class="isschk" data-i="${i}" checked />
        <span><span class="t">${iss.title}</span> <span class="pill ${iss.priority === "High" ? "fail" : "warn"}">${iss.priority}</span>
        <br /><span class="muted">${iss.description}</span>
        <br /><span class="muted">source: ${iss.source}</span></span>
      </label></div>`
    )
    .join("");
  $("issuesOut").innerHTML = `<p>${issues.length} proposed issue(s) — uncheck any you don't want to raise:</p>${html}`;
  show($("issuesOut"));
}

function approvedIssues() {
  const checks = [...document.querySelectorAll(".isschk")];
  return checks.filter((c) => c.checked).map((c) => state.issues[Number(c.dataset.i)]);
}

// Resolve an approved issue to the model element it concerns (for the BCF viewpoint).
// Local-mode issues carry expressID/globalId directly; real-AI issues are matched back to a
// failing IDS finding by ruleId / GlobalId / element name appearing in the issue text.
function resolveTarget(iss) {
  if (iss.expressID !== undefined && iss.expressID !== null) {
    return { expressID: iss.expressID, globalId: iss.globalId };
  }
  const hay = `${iss.title} ${iss.description} ${iss.source}`.toLowerCase();
  const fails = state.idsFindings.filter((x) => x.status === "fail");
  // Prefer an exact GlobalId match (unique per element) so duplicate-rule issues (e.g. 5 windows,
  // all ENERGY_WINDOW_UVALUE) each map to THEIR element; then fall back to ruleId / element name.
  for (const f of fails) {
    if (f.globalId && f.globalId !== "(none)" && hay.includes(String(f.globalId).toLowerCase())) {
      return { expressID: f.expressID, globalId: f.globalId };
    }
  }
  for (const f of fails) {
    const hitRule = f.ruleId && hay.includes(f.ruleId.toLowerCase());
    const hitName = f.name && f.name !== "(unnamed)" && hay.includes(String(f.name).toLowerCase());
    if (hitRule || hitName) return { expressID: f.expressID, globalId: f.globalId };
  }
  return { expressID: undefined, globalId: undefined };
}

// ---- STEP 5: ACTION ----
$("btnBcf").addEventListener("click", async () => {
  const approved = approvedIssues();
  if (!approved.length) {
    $("bcfOut").innerHTML = `<span class="pill warn">No issues selected.</span>`;
    return;
  }

  // Capture a BCF viewpoint (camera + snapshot, element selected) per issue — guarded so a
  // viewer failure just yields a viewpoint-less BCF instead of breaking the export.
  let viewpoints = null;
  try {
    const v = await ensureViewer();
    if (v && v.captureViewpoint && state.geometry.length) {
      viewpoints = approved.map((iss) => {
        const t = resolveTarget(iss);
        const vp = v.captureViewpoint(t.expressID);
        if (vp) vp.ifcGuid = t.globalId;
        return vp;
      });
    }
  } catch (e) { console.warn("[app] viewpoint capture skipped:", e); viewpoints = null; }

  const withVp = viewpoints ? viewpoints.filter(Boolean).length : 0;
  const blob = await buildBcfBlob(approved, viewpoints);
  downloadBlob(blob, "bim-ai-demo-issues.bcf");
  $("bcfOut").innerHTML = `Exported <strong>${approved.length}</strong> issue(s) as an open BCF 2.1 file${withVp ? ` — ${withVp} with a 3D viewpoint (camera + snapshot + selected element)` : ""} — importable into Procore, ACC, or Solibri.`;

  const high = approved.filter((i) => i.priority === "High").length;
  $("resultOut").innerHTML = `
    <p><strong>${approved.length} prioritized, cited issue(s)</strong>${high ? ` (${high} high-priority)` : ""}
       surfaced and exported as an open BCF 2.1 file${withVp ? `, ${withVp} carrying a <strong>3D viewpoint</strong> that flies a reviewer to the exact element` : ""} — a multi-day manual model review + site walk
       compressed into a single pass of about a minute.</p>
    <p>Every finding is <strong>grounded</strong> in the model and reality-capture data (nothing invented),
       and a <strong>human approved</strong> each one before it became an action. Import the BCF into
       Procore / ACC to open the RFIs — the model, the connectors, and the human stay in control;
       the AI model behind it is swappable.</p>`;
  $("resultCard").classList.remove("hide");
});

$("btnWriteback").addEventListener("click", () => {
  const approved = approvedIssues();
  $("bcfOut").innerHTML = `<span class="stub muted">STUB: would write ${approved.length} issue(s) back to Procore RFIs / DataGrid via the connector seam, under this same human approval. No autonomous writes.</span>`;
});

// ---- Preload the web-ifc WASM engine on page load so the first parse is fast ----
(async () => {
  const s = $("engineStatus");
  s.innerHTML = `<span class="spinner"></span>Loading BIM engine (web-ifc WASM)…`;
  try {
    await warmEngine();
    s.innerHTML = `<span class="pill ok">engine ready</span> Click “Load sample model” to begin.`;
  } catch (e) {
    s.innerHTML = `<span class="pill fail">engine failed to load</span> ${e.message}`;
  }
})();
