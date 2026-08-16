// app.js — orchestrates the Plan -> Reality -> Intelligence loop.
import { parseIfc, warmEngine } from "./ifc.js";
import { runIdsChecks } from "./ids.js";
import { loadReality, computeRealityDelta } from "./reality.js";
import { summarizeFindings } from "./ai.js";
import { buildBcfBlob, downloadBlob } from "./bcf.js";

// Backend proxy endpoint for the real DataGrid /converse call (only used if the
// "Use real DataGrid agent" box is checked). Left blank in the static build.
const DATAGRID_ENDPOINT = ""; // e.g. "https://<api>/api/datagrid/analyze"

const SAMPLE_URL = "./sample/IfcOpenHouse.ifc";

const state = {
  model: null,
  elements: [],
  idsFindings: [],
  realityFindings: [],
  issues: []
};

const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hide");

function pill(status) {
  const cls = status === "pass" ? "ok" : status === "fail" ? "fail" : "warn";
  return `<span class="pill ${cls}">${status}</span>`;
}

// ---- STEP 1: PLAN ----
async function loadModelFromBytes(bytes, name) {
  $("modelOut").innerHTML = `<p class="muted"><span class="spinner"></span>Parsing ${name}…</p>`;
  show($("modelOut"));
  const { elements, summary } = await parseIfc(bytes, name);
  state.elements = elements;
  state.model = summary;

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

$("fileInput").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const buf = new Uint8Array(await file.arrayBuffer());
  await loadModelFromBytes(buf, file.name);
});

// ---- STEP 2: IDS ----
$("btnIds").addEventListener("click", () => {
  const findings = runIdsChecks(state.elements);
  state.idsFindings = findings;

  const passes = findings.filter((f) => f.status === "pass").length;
  const rows = findings
    .map((f) => `<tr><td>${pill(f.status)}</td><td>${f.ruleTitle}</td><td>${f.name}</td>
                 <td class="muted">${f.requirement}</td>
                 <td class="muted">${f.observed ?? "—"}</td></tr>`)
    .join("");

  $("idsOut").innerHTML = `
    <p>${passes}/${findings.length} checks passing.</p>
    <table><thead><tr><th></th><th>Requirement</th><th>Element</th><th>Needs</th><th>Observed</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  show($("idsOut"));
  $("btnReality").disabled = false;
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
  $("aiOut").innerHTML = `<p class="muted">Analyzing…</p>`;
  show($("aiOut"));

  const useDg = $("useDatagrid").checked;
  const payload = {
    model: state.model,
    idsFindings: state.idsFindings,
    realityFindings: state.realityFindings
  };

  try {
    const opts = useDg ? { mode: "datagrid", endpoint: DATAGRID_ENDPOINT } : { mode: "local" };
    if (useDg && !DATAGRID_ENDPOINT) {
      throw new Error("No backend endpoint configured — uncheck to use the local summary.");
    }
    const { summary, issues } = await summarizeFindings(payload, opts);
    state.issues = issues;

    $("aiOut").innerHTML = `
      <p class="muted">${useDg ? "DataGrid agent" : "Local grounded summary"}:</p>
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

// ---- STEP 5: ACTION ----
$("btnBcf").addEventListener("click", async () => {
  const approved = approvedIssues();
  if (!approved.length) {
    $("bcfOut").innerHTML = `<span class="pill warn">No issues selected.</span>`;
    return;
  }
  const blob = await buildBcfBlob(approved);
  downloadBlob(blob, "bim-ai-demo-issues.bcf");
  $("bcfOut").innerHTML = `Exported <strong>${approved.length}</strong> issue(s) as an open BCF 2.1 file — importable into Procore, ACC, or Solibri.`;
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
    s.innerHTML = `<span class="pill ok">engine ready</span> Load the sample model or choose an .ifc file.`;
  } catch (e) {
    s.innerHTML = `<span class="pill fail">engine failed to load</span> ${e.message}`;
  }
})();
