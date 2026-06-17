import { supabase } from "../supabase";

export const sportsService = {
  /**
   * Obtiene el perfil completo del estudiante, incluyendo su categoría e historial de rendimiento.
   */
  async getStudentProfile(studentId) {
    const { data, error } = await supabase
      .from("students")
      .select(`
        *,
        parent:profiles!students_parent_id_fkey(*),
        category:categories(*)
      `)
      .eq("id", studentId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Ejecuta un Override Manual de categoría sobre un estudiante.
   * Cambia el tipo de asignación a 'manual' para evitar la promoción automática diaria.
   */
  async overrideStudentCategory(studentId, newCategoryId, reason) {
    // 1. Obtener la categoría anterior del alumno
    const { data: student, error: fetchError } = await supabase
      .from("students")
      .select("category_id")
      .eq("id", studentId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Realizar la actualización del estudiante
    const { error: updateError } = await supabase
      .from("students")
      .update({
        category_id: newCategoryId,
        category_assignment: "manual"
      })
      .eq("id", studentId);

    if (updateError) throw updateError;

    // El trigger en la base de datos (trg_student_category_override)
    // insertará automáticamente en category_history. Pero en caso de no
    // contar con triggers habilitados, lo registramos programáticamente:
    try {
      await supabase.from("category_history").insert({
        student_id: studentId,
        previous_category_id: student.category_id,
        new_category_id: newCategoryId,
        assignment_type: "manual_override",
        reason: reason
      });
    } catch (logError) {
      console.warn("Advertencia al guardar historial programáticamente (puede que el trigger de DB ya lo haya hecho):", logError);
    }

    return { success: true };
  },

  /**
   * Registra la asistencia diaria tomada por un entrenador.
   * @param {Array} attendanceRecords - Array de objetos { studentId, scheduleId, categoryId, status, date }
   * @param {string} coachId - ID del perfil del entrenador que registra
   */
  async logAttendance(attendanceRecords, coachId) {
    const recordsToInsert = attendanceRecords.map(record => ({
      student_id: record.studentId,
      schedule_id: record.scheduleId,
      category_id: record.categoryId,
      date: record.date || new Date().toISOString().split("T")[0],
      status: record.status,
      registered_by: coachId
    }));

    const { data, error } = await supabase
      .from("attendance")
      .insert(recordsToInsert)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Carga una evaluación técnica para el deportista.
   */
  async submitEvaluation(studentId, coachId, categoryId, metrics, tacticalNotes) {
    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        student_id: studentId,
        coach_id: coachId,
        category_id: categoryId,
        date: new Date().toISOString().split("T")[0],
        speed: metrics.speed,
        passing: metrics.passing,
        dribbling: metrics.dribbling,
        shooting: metrics.shooting,
        physical: metrics.physical,
        discipline: metrics.discipline,
        tactical_notes: tacticalNotes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
