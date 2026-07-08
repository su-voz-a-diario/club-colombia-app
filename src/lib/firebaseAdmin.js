import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp;

function requireServerEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} es obligatorio para inicializar Firebase Admin SDK`);
  }
  return value;
}

function getFirebaseAdminApp() {
  if (adminApp) return adminApp;

  const existingApp = getApps()[0];
  if (existingApp) {
    adminApp = existingApp;
    return adminApp;
  }

  const projectId = requireServerEnv("FIREBASE_PROJECT_ID");
  const clientEmail = requireServerEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = requireServerEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
