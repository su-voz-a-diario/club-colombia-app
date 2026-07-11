export function normalizeStudentName(name) {
  return (name || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function categoryNameToId(categoryName) {
  return normalizeStudentName(categoryName)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sin-categoria";
}

/**
 * Función pura selector que calcula el leaderboard/tabla de honor a partir de datos crudos.
 * @param {array} students
 * @param {array} evaluations
 * @param {array} allAttendance
 * @returns {array}
 */
export function calculateLeaderboard(students, evaluations, allAttendance) {
  return (students || []).filter(student => student.status === "active").map(student => {
    // 1. Promedio de evaluaciones
    const studentEvals = (evaluations || []).filter(ev => ev.studentName === student.name);
    let avgScore = null;
    if (studentEvals.length > 0) {
      const sum = studentEvals.reduce((acc, curr) => {
        const m = curr.metrics || {};
        const itemAvg = ((m.speed || 0) + (m.passing || 0) + (m.dribbling || 0) + (m.shooting || 0) + (m.physical || 0) + (m.discipline || 0)) / 6;
        return acc + itemAvg;
      }, 0);
      avgScore = sum / studentEvals.length;
    }

    // 2. Tasa de asistencia
    let totalSessions = 0;
    let presentSessions = 0;
    (allAttendance || []).forEach(att => {
      const record = att.records?.find(r => r.name === student.name);
      if (record) {
        totalSessions++;
        if (record.status === "P" || record.status === "J") {
          presentSessions++;
        }
      }
    });
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : null;

    // 3. Puntos ponderados (Evaluaciones 60%, Asistencia 40%)
    const overallPoints = avgScore !== null && attendanceRate !== null
      ? (avgScore * 10) * 0.6 + attendanceRate * 0.4
      : null;

    return {
      id: student.id,
      name: student.name,
      category: student.category,
      avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      attendanceRate: attendanceRate !== null ? Math.round(attendanceRate) : null,
      overallPoints: overallPoints !== null ? Math.round(overallPoints) : null
    };
  })
    .filter(item => item.avgScore !== null || item.attendanceRate !== null)
    .sort((a, b) => (b.overallPoints ?? -1) - (a.overallPoints ?? -1));
}
