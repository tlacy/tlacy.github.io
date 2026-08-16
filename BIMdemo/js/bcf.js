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

// buildBcfBlob(issues) -> Blob (a .bcf zip). Uses the global JSZip.
export async function buildBcfBlob(issues) {
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
  for (const issue of issues) {
    const g = guid();
    const markup = `<?xml version="1.0" encoding="UTF-8"?>
<Markup xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Topic Guid="${g}" TopicType="Issue" TopicStatus="Open">
    <Title>${esc(issue.title)}</Title>
    <Priority>${esc(issue.priority || "Normal")}</Priority>
    <CreationDate>${now}</CreationDate>
    <CreationAuthor>bim-ai-demo</CreationAuthor>
    <Description>${esc(issue.description || "")}</Description>
  </Topic>
</Markup>`;
    zip.folder(g).file("markup.bcf", markup);
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
