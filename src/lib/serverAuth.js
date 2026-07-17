import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionCookieName, SESSION_EXPIRES_IN_MS } from "@/lib/authSession";
import { normalizeAndValidatePhone } from "@/lib/phone";
import crypto from "crypto";

const ALLOWED_ROLES = new Set(["admin", "coach", "parent"]);
const MAX_ID_TOKEN_AGE_SECONDS = 5 * 60;

function normalizeEmail(email) {
  return typeof email === "string" ? email.toLowerCase() : "";
}

function getRoleCookieSecret() {
  return process.env.AUTH_SESSION_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    "club-colombia-local-session-secret";
}

function signSelectedRole(sessionCookie, role) {
  return crypto
    .createHmac("sha256", getRoleCookieSecret())
    .update(`${sessionCookie}.${role}`)
    .digest("base64url");
}

export function createSelectedRoleCookieValue(sessionCookie, role) {
  return `${role}.${signSelectedRole(sessionCookie, role)}`;
}

function readSelectedRoleCookieValue(sessionCookie, cookieValue) {
  if (!sessionCookie || typeof cookieValue !== "string") return "";
  const separatorIndex = cookieValue.indexOf(".");
  if (separatorIndex <= 0) return "";

  const role = cookieValue.slice(0, separatorIndex);
  const signature = cookieValue.slice(separatorIndex + 1);
  if (!ALLOWED_ROLES.has(role) || !signature) return "";

  const expected = signSelectedRole(sessionCookie, role);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return "";

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer) ? role : "";
}

function normalizeProfileRoles(profile) {
  const roles = Array.isArray(profile.roles)
    ? profile.roles.filter((role) => ALLOWED_ROLES.has(role))
    : [];

  if (roles.length > 0) {
    return [...new Set(roles)];
  }

  return ALLOWED_ROLES.has(profile.role) ? [profile.role] : [];
}

function resolveSessionRole(profile, selectedRole = "") {
  const availableRoles = normalizeProfileRoles(profile);
  const requestedRole = ALLOWED_ROLES.has(selectedRole) ? selectedRole : "";

  if (requestedRole) {
    return availableRoles.includes(requestedRole) ? requestedRole : "";
  }

  if (ALLOWED_ROLES.has(profile.role) && availableRoles.includes(profile.role)) {
    return profile.role;
  }

  return availableRoles[0] || "";
}

function buildSessionFromProfile(decodedToken, profile, extra = {}, selectedRole = "") {
  const sessionRole = resolveSessionRole(profile, selectedRole);
  if (!sessionRole) return null;

  if (profile.uid && profile.uid !== decodedToken.uid) {
    return null;
  }

  return {
    uid: decodedToken.uid,
    email: profile.email || normalizeEmail(decodedToken.email),
    phone: profile.phone || decodedToken.phone_number || "",
    role: sessionRole,
    status: profile.status || "active",
    studentIds: Array.isArray(profile.studentIds) ? profile.studentIds : [],
    ...extra
  };
}

async function getEmailUserProfile(decodedToken, selectedRole = "") {
  const email = normalizeEmail(decodedToken.email);
  if (!email || !decodedToken.uid) {
    return null;
  }

  const db = getAdminDb();
  const uidDoc = await db.collection("users").doc(decodedToken.uid).get();
  if (uidDoc.exists) {
    const session = buildSessionFromProfile(decodedToken, uidDoc.data(), {}, selectedRole);
    if (session?.role === "parent") {
      return null;
    }

    return session;
  }

  // Legacy compatibility
  // TODO remove after migration
  const emailDoc = await db.collection("users").doc(email).get();
  if (!emailDoc.exists) {
    return null;
  }

  const session = buildSessionFromProfile(decodedToken, emailDoc.data(), {}, selectedRole);
  if (session?.role === "parent") {
    return null;
  }

  return session;
}

async function linkParentStudents(db, uid, phone) {
  const studentsSnap = await db
    .collection("students")
    .where("parentPhone", "==", phone)
    .get();

  const studentIds = [];
  const batch = db.batch();
  let pendingWrites = 0;

  studentsSnap.forEach((studentDoc) => {
    const studentData = studentDoc.data();
    const studentId = studentData.studentId || studentDoc.id;
    studentIds.push(studentId);

    if (studentData.parentUid !== uid || studentData.studentId !== studentId) {
      batch.set(studentDoc.ref, {
        studentId,
        parentUid: uid,
        updatedAt: new Date()
      }, { merge: true });
      pendingWrites += 1;
    }
  });

  if (pendingWrites > 0) {
    await batch.commit();
  }

  for (const studentId of studentIds) {
    const paymentsSnap = await db
      .collection("payments")
      .where("studentId", "==", studentId)
      .get();

    const paymentsBatch = db.batch();
    let paymentWrites = 0;

    paymentsSnap.forEach((paymentDoc) => {
      const paymentData = paymentDoc.data();
      if (!paymentData.parentUid && paymentData.studentId === studentId) {
        paymentsBatch.set(paymentDoc.ref, {
          parentUid: uid,
          updatedAt: new Date()
        }, { merge: true });
        paymentWrites += 1;
      }
    });

    if (paymentWrites > 0) {
      await paymentsBatch.commit();
    }
  }

  return studentIds;
}

async function getPhoneParentProfile(decodedToken) {
  if (!decodedToken.uid || !decodedToken.phone_number) {
    return null;
  }

  const phone = normalizeAndValidatePhone(decodedToken.phone_number);
  const db = getAdminDb();
  const userRef = db.collection("users").doc(decodedToken.uid);
  const userSnap = await userRef.get();
  const existingProfile = userSnap.exists ? userSnap.data() : {};

  if (existingProfile.role && existingProfile.role !== "parent") {
    return null;
  }

  if (existingProfile.phone && existingProfile.phone !== phone) {
    return null;
  }

  const studentIds = await linkParentStudents(db, decodedToken.uid, phone);
  studentIds.sort();

  const hasStudents = studentIds.length > 0;
  const determinedStatus = hasStudents
    ? (existingProfile.status && existingProfile.status !== "pending_assignment" ? existingProfile.status : "active")
    : (existingProfile.status || "pending_assignment");

  const patch = {
    uid: decodedToken.uid,
    phone,
    role: "parent",
    status: determinedStatus,
    studentIds,
    updatedAt: new Date()
  };

  if (!userSnap.exists) {
    patch.displayName = "";
    patch.createdAt = new Date();
  }

  // Idempotency check: only write to database if data has changed
  const existingStudentIds = Array.isArray(existingProfile.studentIds) ? [...existingProfile.studentIds].sort() : [];
  const needsWrite =
    !userSnap.exists ||
    existingProfile.phone !== phone ||
    existingProfile.role !== "parent" ||
    existingProfile.status !== determinedStatus ||
    JSON.stringify(existingStudentIds) !== JSON.stringify(studentIds);

  if (needsWrite) {
    await userRef.set(patch, { merge: true });
  }

  return buildSessionFromProfile(decodedToken, {
    ...existingProfile,
    ...patch
  }, { studentIds });
}

async function getCurrentUserProfile(decodedToken, selectedRole = "") {
  if (decodedToken.phone_number) {
    return getPhoneParentProfile(decodedToken);
  }

  return getEmailUserProfile(decodedToken, selectedRole);
}

export async function createVerifiedSessionCookie(idToken, selectedRole = "") {
  const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
  const authTime = decodedToken.auth_time || 0;
  const now = Math.floor(Date.now() / 1000);

  if (now - authTime > MAX_ID_TOKEN_AGE_SECONDS) {
    throw new Error("El inicio de sesión debe ser reciente");
  }

  const session = await getCurrentUserProfile(decodedToken, selectedRole);
  if (!session) {
    throw new Error("Perfil de usuario no autorizado");
  }

  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS
  });

  return { sessionCookie, session };
}

export async function getVerifiedSessionFromRequest(request) {
  const sessionCookie = request.cookies.get(getSessionCookieName())?.value;
  if (!sessionCookie) {
    return null;
  }

  const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  const selectedRole = readSelectedRoleCookieValue(
    sessionCookie,
    request.cookies.get("cc_selected_role")?.value ||
      request.cookies.get("__Host-cc_selected_role")?.value
  );
  return getCurrentUserProfile(decodedToken, selectedRole);
}
