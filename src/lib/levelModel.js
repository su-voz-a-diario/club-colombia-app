export const LEVEL_OPTIONS = [
  { value: "initiation", label: "Iniciación" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" }
];

export const LEVEL_LABELS = LEVEL_OPTIONS.reduce((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

const LEGACY_LEVEL_SUFFIXES = [
  { suffix: "iniciación", level: "initiation" },
  { suffix: "iniciacion", level: "initiation" },
  { suffix: "intermedio", level: "intermediate" },
  { suffix: "competitivo", level: "intermediate" },
  { suffix: "avanzado", level: "advanced" },
  { suffix: "elite", level: "advanced" }
];

export function normalizeLevel(level) {
  const normalized = String(level || "").trim().toLowerCase();
  if (normalized === "iniciación" || normalized === "iniciacion") return "initiation";
  if (normalized === "intermedio" || normalized === "competitivo") return "intermediate";
  if (normalized === "avanzado" || normalized === "elite") return "advanced";
  return LEVEL_LABELS[normalized] ? normalized : "";
}

export function getLevelLabel(level) {
  return LEVEL_LABELS[normalizeLevel(level)] || "Sin nivel";
}

export function getLevelBadgeClass(level) {
  const normalized = normalizeLevel(level);
  if (normalized === "advanced") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (normalized === "intermediate") return "bg-sky-500/10 text-sky-400 border-sky-500/20";
  if (normalized === "initiation") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return "bg-slate-800/70 text-slate-400 border-slate-700";
}

export function parseLegacyCategoryAndLevel(category) {
  const originalCategory = String(category || "").trim();
  if (!originalCategory) {
    return { category: "", level: "", changed: false, ambiguous: false };
  }

  const lowered = originalCategory.toLowerCase();
  const match = LEGACY_LEVEL_SUFFIXES.find(({ suffix }) => lowered.endsWith(` ${suffix}`));
  if (!match) {
    return { category: originalCategory, level: "", changed: false, ambiguous: false };
  }

  const categoryOnly = originalCategory.slice(0, originalCategory.length - match.suffix.length).trim();
  return {
    category: categoryOnly || originalCategory,
    level: match.level,
    changed: !!categoryOnly && categoryOnly !== originalCategory,
    ambiguous: false
  };
}

export function resolveStudentCategoryAndLevel(student) {
  const parsed = parseLegacyCategoryAndLevel(student?.category || "");
  return {
    category: parsed.changed ? parsed.category : (student?.category || ""),
    level: normalizeLevel(student?.level) || parsed.level || ""
  };
}
