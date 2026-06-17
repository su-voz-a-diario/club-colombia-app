import { NextResponse } from "next/server";
import { sportsService } from "@/lib/services/sportsService";

/**
 * Procesa excepciones de categorías deportivas (Manual Override).
 * Permite promover o retener a un estudiante saltándose la regla por edad.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, newCategoryId, reason } = body;

    if (!studentId || !newCategoryId || !reason) {
      return NextResponse.json({ 
        error: "Los campos studentId, newCategoryId y reason son obligatorios" 
      }, { status: 400 });
    }

    const result = await sportsService.overrideStudentCategory(studentId, newCategoryId, reason);

    return NextResponse.json({
      success: true,
      message: "Excepción de categoría guardada exitosamente",
      data: result
    });

  } catch (error) {
    console.error("Error al aplicar override manual de categoría:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
