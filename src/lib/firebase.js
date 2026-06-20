import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Configuración de Firebase para Club Colombia
const firebaseConfig = {
  apiKey: "AIzaSyAxVnroANw-o_nNOtVyAVSJyxRId_Hgr_0",
  authDomain: "club-colombia-futbol.firebaseapp.com",
  projectId: "club-colombia-futbol",
  storageBucket: "club-colombia-futbol.firebasestorage.app",
  messagingSenderId: "38034870040",
  appId: "1:38034870040:web:d8716ce5abb4cc8c97986d"
};

// Inicializar Firebase (evitando inicializaciones duplicadas en Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Sembrar datos iniciales si no existen
export async function seedFirebaseDatabase() {
  try {
    const seedRef = doc(db, "settings", "seeded");
    const seedSnap = await getDoc(seedRef);
    if (seedSnap.exists()) {
      return; // Ya está sembrado
    }

    console.log("Iniciando sembrado de base de datos Firebase...");

    const defaultUsers = [
      {
        email: "luis.lopez@clubcolombia.com",
        password: "luis123",
        role: "admin",
        name: "Profe Luis López",
        status: "active"
      },
      {
        email: "mario.silva@clubcolombia.com",
        password: "mario123",
        role: "coach",
        name: "Entrenador Mario Silva",
        status: "active"
      },
      {
        email: "ricardo.garcia@gmail.com",
        password: "ricardo123",
        role: "parent",
        name: "Ricardo García",
        studentName: "Juan Andrés García",
        categoryName: "Sub-10 Competitivo",
        status: "suspended"
      }
    ];

    // Crear cada usuario en Firebase Auth y guardarlo en Firestore
    for (const u of defaultUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
        const user = userCredential.user;
        
        // Guardar perfil en la colección 'users'
        await setDoc(doc(db, "users", u.email.toLowerCase()), {
          uid: user.uid,
          email: u.email.toLowerCase(),
          role: u.role,
          name: u.name,
          status: u.status,
          ...(u.studentName && { studentName: u.studentName }),
          ...(u.categoryName && { categoryName: u.categoryName })
        });

        // Si es ricardo.garcia, agregar el estudiante a la colección 'students'
        if (u.role === "parent") {
          await setDoc(doc(db, "students", u.studentName), {
            name: u.studentName,
            age: 9,
            category: u.categoryName,
            assignment: "automatic",
            status: u.status,
            dueDays: u.status === "active" ? 0 : 7,
            parentEmail: u.email.toLowerCase(),
            parentName: u.name
          });
        }
      } catch (err) {
        // Si ya existe en auth, solo nos aseguramos de crear el documento en Firestore
        if (err.code === "auth/email-already-in-use") {
          await setDoc(doc(db, "users", u.email.toLowerCase()), {
            email: u.email.toLowerCase(),
            role: u.role,
            name: u.name,
            status: u.status,
            ...(u.studentName && { studentName: u.studentName }),
            ...(u.categoryName && { categoryName: u.categoryName })
          }, { merge: true });

          if (u.role === "parent") {
            await setDoc(doc(db, "students", u.studentName), {
              name: u.studentName,
              age: 9,
              category: u.categoryName,
              assignment: "automatic",
              status: u.status,
              dueDays: u.status === "active" ? 0 : 7,
              parentEmail: u.email.toLowerCase(),
              parentName: u.name
            }, { merge: true });
          }
        } else {
          console.error("Error sembrando usuario:", u.email, err);
        }
      }
    }

    // Cerrar sesión para limpiar el estado de Auth
    await signOut(auth);

    // Marcar como sembrado
    await setDoc(seedRef, { seeded: true, date: new Date().toISOString() });
    console.log("Sembrado completado con éxito.");
  } catch (error) {
    console.error("Error en el proceso de sembrado:", error);
  }
}

export { app, auth, db };
