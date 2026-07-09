import { NextResponse } from "next/server";
import { getVerifiedSessionFromRequest } from "@/lib/serverAuth";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeAndValidatePhone } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // 1. Validar la sesión del usuario
    const session = await getVerifiedSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Acceso no autorizado. Se requieren privilegios de administrador." }, { status: 403 });
    }

    // 2. Leer parámetros de la solicitud
    const { parentUid, oldPhone, newPhone } = await request.json();
    if (!newPhone) {
      return NextResponse.json({ error: "El nuevo número de teléfono es obligatorio." }, { status: 400 });
    }

    // 3. Normalizar el número al formato E.164 (+52...)
    let normalizedPhone;
    try {
      normalizedPhone = normalizeAndValidatePhone(newPhone);
    } catch (err) {
      return NextResponse.json({ error: "Formato de teléfono inválido. Debe incluir el código de país (ej. +521234567890)." }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();

    // 4. Verificar que el número telefónico no esté duplicado en otra cuenta de acudiente activa
    const otherUsersSnap = await db.collection("users")
      .where("phone", "==", normalizedPhone)
      .where("role", "==", "parent")
      .get();

    const duplicateDocs = otherUsersSnap.docs.filter(doc => doc.id !== parentUid);
    if (duplicateDocs.length > 0) {
      return NextResponse.json({ error: "El nuevo número telefónico ya está registrado en otra cuenta de acudiente." }, { status: 400 });
    }

    // 5. Caso A: El acudiente ya está registrado en Firebase Auth & Firestore
    if (parentUid && parentUid.trim() !== "") {
      // Verificar existencia en Firestore
      const userRef = db.collection("users").doc(parentUid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return NextResponse.json({ error: "El perfil de acudiente especificado no existe en la base de datos." }, { status: 404 });
      }

      const userData = userSnap.data();
      if (userData.role !== "parent") {
        return NextResponse.json({ error: "El usuario especificado no tiene el rol de acudiente (parent)." }, { status: 400 });
      }

      // Actualizar en Firebase Authentication
      try {
        await auth.updateUser(parentUid, {
          phoneNumber: normalizedPhone
        });
      } catch (authError) {
        console.error("Error al actualizar en Firebase Auth:", authError);
        if (authError.code === "auth/phone-number-already-exists") {
          return NextResponse.json({ error: "El número telefónico ya está en uso por otra cuenta en Firebase Authentication." }, { status: 400 });
        }
        if (authError.code === "auth/user-not-found") {
          return NextResponse.json({ error: "El usuario no existe en Firebase Authentication." }, { status: 404 });
        }
        return NextResponse.json({ error: `Error en Firebase Auth: ${authError.message}` }, { status: 500 });
      }

      // Actualización atómica en Firestore (users + students)
      const batch = db.batch();
      
      // users/{uid}
      batch.update(userRef, {
        phone: normalizedPhone,
        updatedAt: new Date()
      });

      // students con parentUid == uid
      const studentsSnap = await db.collection("students")
        .where("parentUid", "==", parentUid)
        .get();

      studentsSnap.forEach(studentDoc => {
        batch.update(studentDoc.ref, {
          parentPhone: normalizedPhone,
          updatedAt: new Date()
        });
      });

      await batch.commit();
      console.log(`➔ Teléfono de acudiente ${parentUid} actualizado exitosamente a ${normalizedPhone}.`);
      return NextResponse.json({ success: true, phone: normalizedPhone, registered: true });

    } else {
      // 6. Caso B: El acudiente no está registrado aún (parentUid vacío)
      if (!oldPhone) {
        return NextResponse.json({ error: "El teléfono antiguo es obligatorio cuando no existe parentUid." }, { status: 400 });
      }

      let normalizedOldPhone;
      try {
        normalizedOldPhone = normalizeAndValidatePhone(oldPhone);
      } catch (err) {
        return NextResponse.json({ error: "Formato de teléfono antiguo inválido." }, { status: 400 });
      }

      // Encontrar alumnos con el parentPhone antiguo
      const studentsSnap = await db.collection("students")
        .where("parentPhone", "==", normalizedOldPhone)
        .get();

      if (studentsSnap.size === 0) {
        return NextResponse.json({ error: "No se encontraron alumnos vinculados a este número telefónico." }, { status: 404 });
      }

      // Actualización en lote en Firestore (solo students)
      const batch = db.batch();
      studentsSnap.forEach(studentDoc => {
        batch.update(studentDoc.ref, {
          parentPhone: normalizedPhone,
          updatedAt: new Date()
        });
      });

      await batch.commit();
      console.log(`➔ Enlace de teléfono corregido de ${normalizedOldPhone} a ${normalizedPhone} para ${studentsSnap.size} alumnos.`);
      return NextResponse.json({ success: true, phone: normalizedPhone, registered: false });
    }

  } catch (error) {
    console.error("Error crítico en update-parent-phone API Route:", error);
    return NextResponse.json({ error: `Error interno del servidor: ${error.message}` }, { status: 500 });
  }
}
