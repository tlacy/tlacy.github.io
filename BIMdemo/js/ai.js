// ai.js — the intelligence layer. PLUGGABLE by design:
//   mode "local"    -> deterministic, grounded summary computed from the real findings
//                      (no LLM; safe to host on a static page; makes no claims it can't back up).
//   mode "datagrid" -> POST the findings to a backend proxy that calls the DataGrid
//                      /converse API (Bearer key stays server-side). Returns the agent's
//                      structured, cited issues.
//
// The seam is intentional: the model layer is swappable; the value is the grounded project
// data + the governance around the action. Ride the model frontier; own the data and the loop.

export async function summarizeFindings(payload, opts = {}) {
  const mode = opts.mode || "local";
  if (mode === "datagrid") {
    if (!opts.endpoint) throw new Error("DataGrid mode requires opts.endpoint (backend proxy).");
    const res = await fetch(opts.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("DataGrid analyze failed: " + res.status);
    return res.json(); // { summary, issues:[...] }
  }
  return localSummary(payload);
}

function localSummary({ model, idsFindings, realityFindings }) {
  const fails = idsFindings.filter((f) => f.status === "fail");
  const passes = idsFindings.length - fails.length;

  const byRule = {};
  for (const f of fails) (byRule[f.ruleTitle] ||= []).push(f);

  const lines = [];
  lines.push(`Model "${model.name}": ${model.elementCount} elements across ${model.typeCount} types; ${model.propertySetCount} property set(s) found.`);
  lines.push(`IDS validation: ${passes}/${idsFindings.length} requirement checks passing, ${fails.length} issue(s).`);
  for (const [rule, items] of Object.entries(byRule)) {
    const names = items.slice(0, 3).map((i) => i.name).join(", ");
    lines.push(`• ${rule}: ${items.length} non-conforming element(s) — ${names}${items.length > 3 ? "…" : ""}.`);
  }
  for (const r of realityFindings) {
    lines.push(`• Reality gap — ${r.area}: as-built ${Math.round(r.asBuilt * 100)}% vs planned ${Math.round(r.planned * 100)}% (−${r.gap}%). ${r.note}`);
  }
  lines.push(`Recommendation: raise BCF issues for the items above and route for human approval before any write-back to Procore / DataGrid.`);

  return { summary: lines.join("\n"), issues: buildIssues(idsFindings, realityFindings) };
}

// Turn findings into proposed BCF issues (title/priority/description/source).
export function buildIssues(idsFindings, realityFindings) {
  const issues = [];
  for (const f of idsFindings.filter((x) => x.status === "fail")) {
    issues.push({
      title: `${f.elementType} "${f.name}": missing ${f.requirement}`,
      priority: /FIRE|SAFETY/.test(f.ruleId) ? "High" : "Normal",
      description: `${f.ruleTitle}. ${f.rationale} Element GlobalId ${f.globalId} does not satisfy required ${f.requirement}.`,
      source: `IDS check ${f.ruleId}`
    });
  }
  for (const r of realityFindings) {
    issues.push({
      title: `Reality gap: ${r.area} behind plan (−${r.gap}%)`,
      priority: r.gap >= 50 ? "High" : "Normal",
      description: `${r.area} as-built ${Math.round(r.asBuilt * 100)}% vs planned ${Math.round(r.planned * 100)}%. ${r.note} (DroneDeploy reality capture, aligned via IfcMapConversion / IfcProjectedCRS.)`,
      source: "DroneDeploy reality delta"
    });
  }
  return issues;
}
