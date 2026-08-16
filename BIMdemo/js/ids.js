// ids.js — IDS-style requirement checks (buildingSMART Information Delivery Specification,
// simplified). Each rule is a machine-readable requirement validated against the parsed model.
// This is the "grounded, not hallucinated" layer: the AI reasons over these real pass/fail
// facts, it does not invent them.

export const IDS_RULES = [
  {
    id: "SAFETY_DOOR_FIRE_RATING",
    title: "Life safety — doors must declare a FireRating",
    applies: "IFCDOOR",
    kind: "property",
    property: "FireRating",
    rationale: "Code compliance and life-safety review require every door to carry a fire rating."
  },
  {
    id: "STRUCT_WALL_LOADBEARING",
    title: "Structure — walls must declare LoadBearing",
    applies: "IFCWALLSTANDARDCASE",
    kind: "property",
    property: "LoadBearing",
    rationale: "Structural coordination needs each wall explicitly flagged load-bearing or not."
  },
  {
    id: "ENERGY_WINDOW_UVALUE",
    title: "Energy — windows must declare ThermalTransmittance (U-value)",
    applies: "IFCWINDOW",
    kind: "property",
    property: "ThermalTransmittance",
    rationale: "Energy modeling and code compliance require a U-value for each window."
  },
  {
    id: "COORD_SLAB_NAME",
    title: "Coordination — slabs must be named",
    applies: "IFCSLAB",
    kind: "attribute",
    attribute: "name",
    rationale: "Unnamed elements break coordination, scheduling, and issue tracking."
  },
  {
    id: "IDENTITY_DOOR_GLOBALID",
    title: "Identity — doors must carry a GlobalId",
    applies: "IFCDOOR",
    kind: "attribute",
    attribute: "globalId",
    rationale: "A stable GlobalId is required to track an element across the project lifecycle."
  }
];

// runIdsChecks(elements) -> [{ ruleId, ruleTitle, rationale, elementType, globalId, name,
//                              requirement, observed, status:'pass'|'fail' }]
export function runIdsChecks(elements) {
  const findings = [];
  for (const rule of IDS_RULES) {
    const subjects = elements.filter((e) => e.type === rule.applies);
    for (const el of subjects) {
      let observed;
      if (rule.kind === "property") {
        observed = el.props ? el.props[rule.property] : undefined;
      } else {
        observed = el[rule.attribute];
      }
      const pass = observed !== undefined && observed !== null && observed !== "";
      findings.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        rationale: rule.rationale,
        elementType: rule.applies,
        expressID: el.expressID,
        globalId: el.globalId || "(none)",
        name: el.name || "(unnamed)",
        requirement: rule.kind === "property" ? `property "${rule.property}"` : `attribute "${rule.attribute}"`,
        observed: observed ?? null,
        status: pass ? "pass" : "fail"
      });
    }
  }
  return findings;
}
