import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getVerifiedSessionFromRequest } from "@/lib/serverAuth";
import { normalizeLevel } from "@/lib/levelModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedRole(role) {
  return role === "admin" || role === "coach";
}

export async function POST(request) {
  try {
    const session = await getVerifiedSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!isAllowedRole(session.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const level = normalizeLevel(body.level);

    if (!studentId) {
      return NextResponse.json({ error: "studentId requerido" }, { status: 400 });
    }

    if (body.level && !level) {
      return NextResponse.json({ error: "Nivel no válido" }, { status: 400 });
    }

    const db = getAdminDb();
    const studentRef = db.collection("students").doc(studentId);
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
      return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
    }

    await studentRef.set({
      level: level || null,
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      studentId,
      level: level || null
    });
  } catch (error) {
    console.error("Error al actualizar nivel del alumno:", error);
    return NextResponse.json({
      success: false,
      error: "No fue posible actualizar el nivel del alumno"
    }, { status: 500 });
  }
}
