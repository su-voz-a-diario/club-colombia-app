#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

function parseArgs(argv) {
  const args = {
    commit: false,
    dryRun: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--commit") {
      args.commit = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  // Si no se especifica --commit, por defecto es dry-run
  if (!args.commit) {
    args.dryRun = true;
  }

  return args;
}

function initializeFirebaseAdmin() {
  if (admin.getApps().length > 0) return;

  const localServiceAccountPath = path.join(__dirname, "../club-colombia-futbol-firebase-adminsdk-fbsvc-2aa1a9a36c.json");
  if (fs.existsSync(localServiceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    console.log("Firebase Admin inicializado con Service Account local.");
    return;
  }

  // Fallback para producción (Vercel)
  admin.initializeApp();
  console.log("Firebase Admin inicializado con variables de entorno.");
}

async function runMigration() {
  const args = parseArgs(process.argv);
  initializeFirebaseAdmin();

  const db = getFirestore();
  const auth = getAuth();

  console.log("\n=== INICIANDO MIGRACIÓN DE USUARIOS A users/{uid} ===");
  console.log(`Modo: ${args.commit ? "COMMIT (Escritura Real)" : "DRY-RUN (Simulación)"}\n`);

  const usersColl = db.collection("users");
  const snapshot = await usersColl.get();

  const report = {
    total: snapshot.size,
    migrated: 0,
    skippedAlreadyUid: 0,
    skippedAuthNotFound: 0,
    errors: 0
  };

  for (const docSnap of snapshot.docs) {
    const docId = docSnap.id;
    const userData = docSnap.data();

    // 1. Validar si el ID de documento es un correo electrónico (contiene @)
    if (!docId.includes("@")) {
      report.skippedAlreadyUid++;
      console.log(`[IGNORADO] El documento '${docId}' ya utiliza formato UID.`);
      continue;
    }

    const email = docId.toLowerCase().trim();
    console.log(`[PROCESANDO] Documento legacy encontrado: '${email}'`);

    try {
      // 2. Buscar el UID correspondiente en Firebase Auth
      let authUser;
      try {
        authUser = await auth.getUserByEmail(email);
      } catch (authError) {
        if (authError.code === "auth/user-not-found") {
          report.skippedAuthNotFound++;
          console.warn(`[ADVERTENCIA] No existe usuario en Firebase Auth para el correo '${email}'. Se conserva como legacy.`);
          continue;
        }
        throw authError;
      }

      const uid = authUser.uid;
      const targetDocRef = usersColl.doc(uid);

      // Copiar todos los datos y asegurar los campos obligatorios
      const newUserData = {
        ...userData,
        uid: uid,
        email: email,
        updatedAt: new Date()
      };

      if (args.commit) {
        // Escribir el nuevo documento con merge: true
        await targetDocRef.set(newUserData, { merge: true });
        // Eliminar el documento legacy
        await docSnap.ref.delete();
        console.log(`[MIGRADO] '${email}' -> '${uid}' (Documento legacy eliminado)`);
      } else {
        console.log(`[DRY-RUN] Migraría '${email}' -> '${uid}'`);
      }
      report.migrated++;

    } catch (error) {
      report.errors++;
      console.error(`[ERROR] Fallo al migrar '${email}':`, error.message);
    }
  }

  console.log("\n=== RESUMEN DE LA MIGRACIÓN ===");
  console.log(`- Total de documentos revisados: ${report.total}`);
  console.log(`- Documentos migrados/procesados: ${report.migrated}`);
  console.log(`- Documentos ya en formato UID: ${report.skippedAlreadyUid}`);
  console.log(`- Documentos omitidos (sin cuenta en Auth): ${report.skippedAuthNotFound}`);
  console.log(`- Errores encontrados: ${report.errors}`);
  console.log("===============================\n");
}

runMigration().catch(error => {
  console.error("Fallo general en la migración:", error);
  process.exit(1);
});
