import { normalizeLevel, resolveStudentCategoryAndLevel } from "@/lib/levelModel";

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" }
];

export function getWeekdayLabel(dayOfWeek) {
  const numericDay = Number(dayOfWeek);
  return WEEKDAY_OPTIONS.find((day) => day.value === numericDay)?.label || "Sin día";
}

export function normalizeTrainingSchedule(rawSchedule = {}) {
  const level = normalizeLevel(rawSchedule.level);
  return {
    title: String(rawSchedule.title || "").trim(),
    dayOfWeek: Number(rawSchedule.dayOfWeek),
    startTime: String(rawSchedule.startTime || "").trim(),
    endTime: rawSchedule.endTime ? String(rawSchedule.endTime).trim() : null,
    category: String(rawSchedule.category || "").trim(),
    level: level || null,
    coachUid: rawSchedule.coachUid || null,
    coachName: rawSchedule.coachName || null,
    location: String(rawSchedule.location || "").trim(),
    active: rawSchedule.active !== false,
    description: String(rawSchedule.description || "").trim()
  };
}

export function trainingScheduleMatchesStudent(schedule, student) {
  if (!schedule?.active) return false;
  const studentModel = resolveStudentCategoryAndLevel(student);
  if (!schedule.category || !studentModel.category) return false;
  if (schedule.category !== studentModel.category) return false;
  if (!schedule.level) return true;
  return normalizeLevel(schedule.level) === normalizeLevel(studentModel.level);
}

export function sortTrainingSchedules(a, b) {
  return Number(a.dayOfWeek ?? 9) - Number(b.dayOfWeek ?? 9) ||
    String(a.startTime || "").localeCompare(String(b.startTime || "")) ||
    String(a.title || "").localeCompare(String(b.title || ""));
}
