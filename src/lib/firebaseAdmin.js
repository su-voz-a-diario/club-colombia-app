import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

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

  // 1. Intentar cargar desde el archivo JSON de la Service Account local si existe
  const localServiceAccountPath = path.join(process.cwd(), "club-colombia-futbol-firebase-adminsdk-fbsvc-2aa1a9a36c.json");
  if (fs.existsSync(localServiceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf8"));
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
      return adminApp;
    } catch (e) {
      console.warn("Advertencia: No se pudo cargar el archivo Service Account local:", e.message);
    }
  }

  // 2. Fallback a variables de entorno para Vercel
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

