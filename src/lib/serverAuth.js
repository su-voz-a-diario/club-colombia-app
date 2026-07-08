import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionCookieName, SESSION_EXPIRES_IN_MS } from "@/lib/authSession";

const ALLOWED_ROLES = new Set(["admin", "coach", "parent"]);
const MAX_ID_TOKEN_AGE_SECONDS = 5 * 60;

function normalizeEmail(email) {
  return typeof email === "string" ? email.toLowerCase() : "";
}

async function getCurrentUserProfile(decodedToken) {
  const email = normalizeEmail(decodedToken.email);
  if (!email || !decodedToken.uid) {
    return null;
  }

  const userDoc = await getAdminDb().collection("users").doc(email).get();
  if (!userDoc.exists) {
    return null;
  }

  const profile = userDoc.data();
  if (!ALLOWED_ROLES.has(profile.role)) {
    return null;
  }

  if (profile.uid && profile.uid !== decodedToken.uid) {
    return null;
  }

  return {
    uid: decodedToken.uid,
    email,
    role: profile.role,
    status: profile.status || "active"
  };
}

export async function createVerifiedSessionCookie(idToken) {
  const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
  const authTime = decodedToken.auth_time || 0;
  const now = Math.floor(Date.now() / 1000);

  if (now - authTime > MAX_ID_TOKEN_AGE_SECONDS) {
    throw new Error("El inicio de sesión debe ser reciente");
  }

  const session = await getCurrentUserProfile(decodedToken);
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
  return getCurrentUserProfile(decodedToken);
}
