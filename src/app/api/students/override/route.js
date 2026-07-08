import { NextResponse } from "next/server";
import { sportsService } from "@/lib/services/sportsService";
import { getVerifiedSessionFromRequest } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REASON_LENGTH = 500;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Procesa excepciones de categorías deportivas (Manual Override).
 * Permite promover o retener a un estudiante saltándose la regla por edad.
 */
export async function POST(request) {
  try {
    const session = await getVerifiedSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, newCategoryId, reason } = body;

    if (!isNonEmptyString(studentId) || !isNonEmptyString(newCategoryId) || !isNonEmptyString(reason)) {
      return NextResponse.json({ 
        error: "Los campos studentId, newCategoryId y reason son obligatorios" 
      }, { status: 400 });
    }

    if (reason.trim().length > MAX_REASON_LENGTH) {
      return NextResponse.json({
        error: `reason no puede superar ${MAX_REASON_LENGTH} caracteres`
      }, { status: 400 });
    }

    const result = await sportsService.overrideStudentCategory(
      studentId.trim(),
      newCategoryId.trim(),
      reason.trim()
    );

    return NextResponse.json({
      success: true,
      message: "Excepción de categoría guardada exitosamente",
      data: result
    });

  } catch (error) {
    console.error("Error al aplicar override manual de categoría:", error);
    return NextResponse.json({ 
      success: false, 
      error: "No se pudo aplicar la excepción de categoría"
    }, { status: 500 });
  }
}
