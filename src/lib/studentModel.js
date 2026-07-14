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
  const evalsMap = new Map();
  (evaluations || []).forEach(ev => {
    if (!ev.studentName) return;
    if (!evalsMap.has(ev.studentName)) evalsMap.set(ev.studentName, []);
    evalsMap.get(ev.studentName).push(ev);
  });

  const attendanceMap = new Map();
  (allAttendance || []).forEach(att => {
    (att.records || []).forEach(r => {
      if (!r.name) return;
      if (!attendanceMap.has(r.name)) attendanceMap.set(r.name, { total: 0, present: 0 });
      const stats = attendanceMap.get(r.name);
      stats.total++;
      if (r.status === "P" || r.status === "J") {
        stats.present++;
      }
    });
  });

  return (students || []).filter(student => student.status === "active").map(student => {
    const studentEvals = evalsMap.get(student.name) || [];
    let avgScore = null;
    if (studentEvals.length > 0) {
      const sum = studentEvals.reduce((acc, curr) => {
        const m = curr.metrics || {};
        const itemAvg = ((m.speed || 0) + (m.passing || 0) + (m.dribbling || 0) + (m.shooting || 0) + (m.physical || 0) + (m.discipline || 0)) / 6;
        return acc + itemAvg;
      }, 0);
      avgScore = sum / studentEvals.length;
    }

    const attStats = attendanceMap.get(student.name);
    let attendanceRate = null;
    if (attStats && attStats.total > 0) {
      attendanceRate = (attStats.present / attStats.total) * 100;
    }

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
