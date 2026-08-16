// bcf.js — emit a buildingSMART BCF 2.1 (BIM Collaboration Format) issue container.
// This is the governed "system of action" output: approved findings become a portable,
// open-standard issue file that any BCF-compatible tool (Procore, ACC, Solibri, …) can import.
// Requires JSZip (loaded globally in index.html).

function esc(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  }[c]));
}

function guid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// A BCF 2.1 viewpoint (VisualizationInfo): camera in IFC world coords + optional element selection.
function buildBcfv(vp, vpGuid) {
  const c = vp.camera;
  const sel = vp.ifcGuid && vp.ifcGuid !== "(none)"
    ? `\n    <Selection>\n      <Component IfcGuid="${esc(vp.ifcGuid)}" />\n    </Selection>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<VisualizationInfo Guid="${vpGuid}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Components>${sel}
    <Visibility DefaultVisibility="true" />
  </Components>
  <PerspectiveCamera>
    <CameraViewPoint><X>${c.pos.x}</X><Y>${c.pos.y}</Y><Z>${c.pos.z}</Z></CameraViewPoint>
    <CameraDirection><X>${c.dir.x}</X><Y>${c.dir.y}</Y><Z>${c.dir.z}</Z></CameraDirection>
    <CameraUpVector><X>${c.up.x}</X><Y>${c.up.y}</Y><Z>${c.up.z}</Z></CameraUpVector>
    <FieldOfView>${c.fov}</FieldOfView>
  </PerspectiveCamera>
</VisualizationInfo>`;
}

// buildBcfBlob(issues, viewpoints?) -> Blob (a .bcf zip). Uses the global JSZip.
// viewpoints (optional) is an array parallel to issues; each entry (or null) is the result of
// viewer.captureViewpoint(...) — when present, the issue gets a camera + snapshot in the export.
export async function buildBcfBlob(issues, viewpoints = null) {
  const JSZip = window.JSZip;
  if (!JSZip) throw new Error("JSZip not loaded");
  const zip = new JSZip();

  zip.file(
    "bcf.version",
    `<?xml version="1.0" encoding="UTF-8"?>
<Version VersionId="2.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <DetailedVersion>2.1</DetailedVersion>
</Version>`
  );

  const now = new Date().toISOString();
  for (let idx = 0; idx < issues.length; idx++) {
    const issue = issues[idx];
    const g = guid();
    const vp = viewpoints && viewpoints[idx];
    const vpGuid = vp ? guid() : null;
    const viewpointsXml = vp
      ? `\n  <Viewpoints Guid="${vpGuid}">\n    <Viewpoint>viewpoint.bcfv</Viewpoint>\n    <Snapshot>snapshot.png</Snapshot>\n  </Viewpoints>`
      : "";
    const markup = `<?xml version="1.0" encoding="UTF-8"?>
<Markup xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Topic Guid="${g}" TopicType="Issue" TopicStatus="Open">
    <Title>${esc(issue.title)}</Title>
    <Priority>${esc(issue.priority || "Normal")}</Priority>
    <CreationDate>${now}</CreationDate>
    <CreationAuthor>bim-ai-demo</CreationAuthor>
    <Description>${esc(issue.description || "")}</Description>
  </Topic>${viewpointsXml}
</Markup>`;
    const folder = zip.folder(g);
    folder.file("markup.bcf", markup);
    if (vp) {
      folder.file("viewpoint.bcfv", buildBcfv(vp, vpGuid));
      const b64 = vp.snapshot && vp.snapshot.split(",")[1];
      if (b64) folder.file("snapshot.png", b64, { base64: true });
    }
  }

  return zip.generateAsync({ type: "blob" });
}

// Trigger a browser download of the BCF file.
export function downloadBlob(blob, filename = "issues.bcf") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
