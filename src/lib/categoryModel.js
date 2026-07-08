export const CATEGORY_REQUIRED_FIELDS = ["categoryId", "name"];

export const CATEGORY_DEFAULTS = {
  shortName: "",
  ageMin: null,
  ageMax: null,
  monthlyFee: 0,
  inscriptionFee: 0,
  active: true,
  assignedCoachUid: "",
  coachName: "",
  trainingDays: [],
  trainingHours: "",
  maxStudents: 0,
  currentStudents: 0,
  description: ""
};

export function normalizeCategoryId(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCategoryName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function parseNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "si", "sí", "active", "activo"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive", "inactivo"].includes(normalized)) return false;
  return fallback;
}

export function parseTrainingDays(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (!value) return [];
  return String(value)
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeCategoryInput(input) {
  const categoryId = normalizeCategoryId(input.categoryId);
  const name = normalizeCategoryName(input.name);

  return {
    categoryId,
    name,
    shortName: normalizeCategoryName(input.shortName || CATEGORY_DEFAULTS.shortName),
    ageMin: parseOptionalNumber(input.ageMin),
    ageMax: parseOptionalNumber(input.ageMax),
    monthlyFee: parseNumber(input.monthlyFee, CATEGORY_DEFAULTS.monthlyFee),
    inscriptionFee: parseNumber(input.inscriptionFee, CATEGORY_DEFAULTS.inscriptionFee),
    active: parseBoolean(input.active, CATEGORY_DEFAULTS.active),
    assignedCoachUid: String(input.assignedCoachUid || CATEGORY_DEFAULTS.assignedCoachUid).trim(),
    coachName: normalizeCategoryName(input.coachName || CATEGORY_DEFAULTS.coachName),
    trainingDays: parseTrainingDays(input.trainingDays),
    trainingHours: normalizeCategoryName(input.trainingHours || CATEGORY_DEFAULTS.trainingHours),
    maxStudents: parseNumber(input.maxStudents, CATEGORY_DEFAULTS.maxStudents),
    currentStudents: parseNumber(input.currentStudents, CATEGORY_DEFAULTS.currentStudents),
    description: String(input.description || CATEGORY_DEFAULTS.description).trim()
  };
}

export function validateCategoryInput(input) {
  const normalized = normalizeCategoryInput(input);
  const errors = [];
  const warnings = [];

  if (!normalized.categoryId) errors.push("categoryId es obligatorio");
  if (!normalized.name) errors.push("name es obligatorio");
  if (normalized.ageMin !== null && normalized.ageMin < 0) errors.push("ageMin no puede ser negativo");
  if (normalized.ageMax !== null && normalized.ageMax < 0) errors.push("ageMax no puede ser negativo");
  if (normalized.ageMin !== null && normalized.ageMax !== null && normalized.ageMin > normalized.ageMax) {
    errors.push("ageMin no puede ser mayor que ageMax");
  }
  if (normalized.monthlyFee < 0) errors.push("monthlyFee no puede ser negativo");
  if (normalized.inscriptionFee < 0) errors.push("inscriptionFee no puede ser negativo");
  if (normalized.maxStudents < 0) errors.push("maxStudents no puede ser negativo");
  if (normalized.currentStudents < 0) errors.push("currentStudents no puede ser negativo");
  if (normalized.maxStudents > 0 && normalized.currentStudents > normalized.maxStudents) {
    warnings.push("currentStudents es mayor que maxStudents");
  }
  if (!normalized.active) warnings.push("categoria inactiva");

  return {
    normalized,
    errors,
    warnings
  };
}
