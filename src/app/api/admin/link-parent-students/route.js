import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { getVerifiedSessionFromRequest } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean))];
}

export async function POST(request) {
  try {
    const session = await getVerifiedSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const parentUid = typeof body.parentUid === "string" ? body.parentUid.trim() : "";
    const requestedStudentIds = uniqueStrings(body.studentIds);

    if (!parentUid || requestedStudentIds.length === 0) {
      return NextResponse.json({ success: false, error: "parentUid y studentIds[] son obligatorios" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    const authUser = await auth.getUser(parentUid);
    const userRef = db.collection("users").doc(parentUid);
    const userSnap = await userRef.get();
    const existingUser = userSnap.exists ? userSnap.data() : {};
    if (existingUser.role && existingUser.role !== "parent") {
      return NextResponse.json({
        success: false,
        error: "El usuario localizado existe pero no tiene rol parent"
      }, { status: 409 });
    }

    const existingStudentIds = Array.isArray(existingUser.studentIds) ? existingUser.studentIds : [];
    const finalStudentIds = uniqueStrings([...existingStudentIds, ...requestedStudentIds]);
    const studentRefs = [];
    const studentSnaps = [];

    for (const studentId of requestedStudentIds) {
      const studentRef = db.collection("students").doc(studentId);
      const studentSnap = await studentRef.get();
      if (!studentSnap.exists) {
        return NextResponse.json({
          success: false,
          error: `El alumno ${studentId} no existe`
        }, { status: 404 });
      }

      const studentData = studentSnap.data();
      if (studentData.parentUid && studentData.parentUid !== parentUid) {
        return NextResponse.json({
          success: false,
          error: `El alumno ${studentId} ya está vinculado a otro padre`
        }, { status: 409 });
      }

      studentRefs.push(studentRef);
      studentSnaps.push(studentSnap);
    }

    const paymentUpdates = [];
    for (const studentSnap of studentSnaps) {
      const studentData = studentSnap.data();
      const studentId = studentData.studentId || studentSnap.id;
      const paymentsSnap = await db.collection("payments").where("studentId", "==", studentId).get();
      paymentsSnap.forEach((paymentSnap) => {
        const paymentData = paymentSnap.data();
        if (!paymentData.parentUid && paymentData.studentId === studentId) {
          paymentUpdates.push(paymentSnap.ref);
        }
      });
    }

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();

    batch.set(userRef, {
      uid: parentUid,
      phone: existingUser.phone || authUser.phoneNumber || "",
      email: existingUser.email || (authUser.email || "").toLowerCase(),
      role: "parent",
      status: "active",
      studentIds: finalStudentIds,
      updatedAt: now,
      ...(userSnap.exists ? {} : { createdAt: now, displayName: "" })
    }, { merge: true });

    for (const studentRef of studentRefs) {
      batch.set(studentRef, {
        parentUid,
        updatedAt: now
      }, { merge: true });
    }

    for (const paymentRef of paymentUpdates) {
      batch.set(paymentRef, {
        parentUid,
        updatedAt: now
      }, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      parentUid,
      linkedStudentIds: requestedStudentIds,
      finalStudentIds,
      updatedPayments: paymentUpdates.length,
      userCreated: !userSnap.exists
    });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ success: false, error: "Usuario Auth no encontrado" }, { status: 404 });
    }

    console.error("Error al vincular padre y alumnos:", error.message);
    return NextResponse.json({ success: false, error: "No se pudo vincular padre y alumnos" }, { status: 500 });
  }
}
