import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getVerifiedSessionFromRequest } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function resolveStudent(db, payment) {
  const declaredStudentId = typeof payment.studentId === "string" ? payment.studentId.trim() : "";

  if (declaredStudentId) {
    const studentRef = db.collection("students").doc(declaredStudentId);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) {
      return {
        ok: false,
        status: 422,
        error: "No fue posible aprobar el pago porque el studentId del pago no existe."
      };
    }

    return { ok: true, studentRef, studentSnap, studentId: declaredStudentId, resolution: "studentId" };
  }

  const studentName = typeof payment.studentName === "string" ? payment.studentName.trim() : "";
  if (!studentName) {
    return {
      ok: false,
      status: 422,
      error: "No fue posible aprobar el pago porque no tiene studentId ni studentName legacy."
    };
  }

  const legacySnap = await db.collection("students").where("name", "==", studentName).get();
  if (legacySnap.empty) {
    return {
      ok: false,
      status: 422,
      error: "No fue posible aprobar el pago porque no se encontró un alumno con el nombre registrado."
    };
  }

  if (legacySnap.size > 1) {
    return {
      ok: false,
      status: 409,
      error: "No fue posible aprobar el pago porque el nombre del alumno coincide con más de un registro."
    };
  }

  const studentSnap = legacySnap.docs[0];
  const studentData = studentSnap.data();
  return {
    ok: true,
    studentRef: studentSnap.ref,
    studentSnap,
    studentId: studentData.studentId || studentSnap.id,
    resolution: "studentName"
  };
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
    const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";

    if (!isNonEmptyString(paymentId)) {
      return NextResponse.json({ success: false, error: "paymentId es obligatorio" }, { status: 400 });
    }

    const db = getAdminDb();
    const paymentRef = db.collection("payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return NextResponse.json({ success: false, error: "El pago no existe" }, { status: 404 });
    }

    const payment = paymentSnap.data();
    if (payment.status !== "pending") {
      return NextResponse.json({
        success: false,
        error: "Solo se pueden aprobar pagos en estado pending"
      }, { status: 409 });
    }

    const resolved = await resolveStudent(db, payment);
    if (!resolved.ok) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });
    }

    const studentData = resolved.studentSnap.data();
    const parentUid = typeof studentData.parentUid === "string" ? studentData.parentUid.trim() : "";
    const parentEmail = typeof studentData.parentEmail === "string" ? studentData.parentEmail.trim().toLowerCase() : "";
    
    let userRef = null;
    if (parentUid) {
      userRef = db.collection("users").doc(parentUid);
    } else if (parentEmail) {
      userRef = db.collection("users").doc(parentEmail);
    }
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const latestPaymentSnap = await transaction.get(paymentRef);
      if (!latestPaymentSnap.exists) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      const latestPayment = latestPaymentSnap.data();
      if (latestPayment.status !== "pending") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      if (latestPayment.studentId !== payment.studentId || latestPayment.studentName !== payment.studentName) {
        throw new Error("PAYMENT_CHANGED");
      }

      const latestStudentSnap = await transaction.get(resolved.studentRef);
      if (!latestStudentSnap.exists) {
        throw new Error("STUDENT_NOT_FOUND");
      }

      const latestStudent = latestStudentSnap.data();
      const isInactiveStudent = latestStudent.status === "inactive";

      transaction.update(paymentRef, {
        status: "approved",
        approvedAt: now,
        updatedAt: now,
        resolvedStudentId: resolved.studentId
      });

      const studentPatch = {
        billingStatus: "paid",
        dueDays: 0,
        updatedAt: now
      };

      if (!isInactiveStudent) {
        studentPatch.status = "active";
      }

      transaction.update(resolved.studentRef, studentPatch);

      if (userRef && !isInactiveStudent) {
        transaction.set(userRef, {
          status: "active",
          updatedAt: now
        }, { merge: true });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Pago aprobado correctamente",
      paymentId,
      studentId: resolved.studentId,
      parentUid: parentUid || null,
      resolution: resolved.resolution
    });
  } catch (error) {
    if (error.message === "PAYMENT_NOT_PENDING") {
      return NextResponse.json({
        success: false,
        error: "El pago ya no está pendiente"
      }, { status: 409 });
    }

    if (error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({
        success: false,
        error: "El pago no existe"
      }, { status: 404 });
    }

    if (error.message === "PAYMENT_CHANGED") {
      return NextResponse.json({
        success: false,
        error: "El pago cambió durante la aprobación. Vuelve a intentarlo."
      }, { status: 409 });
    }

    if (error.message === "STUDENT_NOT_FOUND") {
      return NextResponse.json({
        success: false,
        error: "El alumno asociado al pago ya no existe"
      }, { status: 404 });
    }

    console.error("Error al aprobar pago desde API:", error.message);
    return NextResponse.json({
      success: false,
      error: "No fue posible aprobar el pago"
    }, { status: 500 });
  }
}
