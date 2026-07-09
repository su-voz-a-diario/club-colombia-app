import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { categoryNameToId, normalizeStudentName } from "@/lib/studentModel";

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
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE_SEED !== "true") {
    throw new Error("seedFirebaseDatabase está deshabilitado fuera de entornos controlados.");
  }

  try {
    const seedRef = doc(db, "settings", "seeded_v2");
    const seedSnap = await getDoc(seedRef);
    if (seedSnap.exists()) {
      return; // Ya está sembrado
    }

    console.log("Iniciando sembrado de base de datos Firebase...");

    const defaultUsers = [
      {
        email: "tododeportesluis@gmail.com",
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
      }
    ];

    // Crear cada usuario en Firebase Auth y guardarlo en Firestore
    for (const u of defaultUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
        const user = userCredential.user;
        
        // Guardar perfil en la colección 'users' bajo users/{uid}
        await setDoc(doc(db, "users", user.uid), {
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
          const studentDocRef = doc(collection(db, "students"));
          const studentId = studentDocRef.id;
          await setDoc(studentDocRef, {
            studentId,
            name: u.studentName,
            normalizedName: normalizeStudentName(u.studentName),
            age: 9,
            parentName: u.name,
            parentEmail: u.email.toLowerCase(),
            parentUid: user.uid,
            categoryId: categoryNameToId(u.categoryName),
            category: u.categoryName,
            assignedCoachUid: "",
            assignment: "automatic",
            status: u.status,
            billingStatus: u.status === "active" ? "paid" : "pending_payment",
            healthStatus: "optimal",
            dueDays: u.status === "active" ? 0 : 7,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
        // Si ya existe en auth, solo nos aseguramos de crear el documento en Firestore
        if (err.code === "auth/email-already-in-use") {
          // Intentar buscar documento existente por campo email para no crear duplicados en users/{email}
          const q = query(collection(db, "users"), where("email", "==", u.email.toLowerCase()));
          const qSnap = await getDocs(q);
          
          let docRef;
          if (!qSnap.empty) {
            docRef = qSnap.docs[0].ref;
          } else {
            docRef = doc(db, "users", u.email.toLowerCase());
          }

          await setDoc(docRef, {
            email: u.email.toLowerCase(),
            role: u.role,
            name: u.name,
            status: u.status,
            ...(u.studentName && { studentName: u.studentName }),
            ...(u.categoryName && { categoryName: u.categoryName })
          }, { merge: true });

          if (u.role === "parent") {
            const studentDocRef = doc(collection(db, "students"));
            const studentId = studentDocRef.id;
            await setDoc(studentDocRef, {
              studentId,
              name: u.studentName,
              normalizedName: normalizeStudentName(u.studentName),
              age: 9,
              parentName: u.name,
              parentEmail: u.email.toLowerCase(),
              parentUid: "",
              categoryId: categoryNameToId(u.categoryName),
              category: u.categoryName,
              assignedCoachUid: "",
              assignment: "automatic",
              status: u.status,
              billingStatus: u.status === "active" ? "paid" : "pending_payment",
              healthStatus: "optimal",
              dueDays: u.status === "active" ? 0 : 7,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } else {
          console.error("Error sembrando usuario:", u.email, err);
        }
      }
    }

    // 1. Sembrar Historial de Evaluaciones para Juan Andrés García (últimos 3 meses)
    const mockEvaluations = [
      {
        studentName: "Juan Andrés García",
        metrics: { speed: 6, passing: 6, dribbling: 5, shooting: 6, physical: 7, discipline: 8 },
        tacticalNotes: "Buen inicio de microciclo. Debe mejorar el golpeo con pierna zurda y la colocación en el achique.",
        date: "15/04/2026",
        timestamp: "2026-04-15T10:00:00.000Z"
      },
      {
        studentName: "Juan Andrés García",
        metrics: { speed: 7, passing: 7, dribbling: 6, shooting: 7, physical: 7, discipline: 9 },
        tacticalNotes: "Muestra gran avance en el pase corto y disciplina. Excelente actitud en los entrenamientos.",
        date: "15/05/2026",
        timestamp: "2026-05-15T10:00:00.000Z"
      },
      {
        studentName: "Juan Andrés García",
        metrics: { speed: 8, passing: 7, dribbling: 8, shooting: 8, physical: 8, discipline: 9 },
        tacticalNotes: "Gran velocidad y regate en banda. Listo para el torneo de fin de semana. Sigue con este ritmo.",
        date: "15/06/2026",
        timestamp: "2026-06-15T10:00:00.000Z"
      }
    ];

    for (const ev of mockEvaluations) {
      await addDoc(collection(db, "evaluations"), ev);
    }
    console.log("Evaluaciones históricas de prueba sembradas.");

    // 2. Sembrar Eventos del Calendario
    const mockEvents = [
      {
        title: "Técnica Individual y Conducción",
        type: "training",
        date: "2026-06-25",
        time: "17:00",
        location: "Cancha Principal, Club Colombia",
        category: "Sub-10 Competitivo",
        description: "Enfoque en pase corto, recepción perfilada y definición."
      },
      {
        title: "Táctica y Balón Parado",
        type: "training",
        date: "2026-06-27",
        time: "17:00",
        location: "Cancha Principal, Club Colombia",
        category: "Sub-10 Competitivo",
        description: "Jugadas de córner, tiros libres y posicionamiento defensivo."
      },
      {
        title: "Jornada 4: Club Colombia vs Rayados",
        type: "match",
        date: "2026-06-28",
        time: "09:00",
        location: "Campos de San Pedro (Cancha 3)",
        category: "Sub-10 Competitivo",
        description: "Llegar 30 minutos antes para calentamiento. Llevar uniforme verde."
      }
    ];

    for (const ev of mockEvents) {
      // Usamos setDoc con id fijo para evitar duplicaciones
      const eventId = ev.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      await setDoc(doc(db, "events", eventId), ev);
    }
    console.log("Eventos de prueba sembrados.");

    // 3. Sembrar Biblioteca de Ejercicios Multimedia (Drills)
    const mockDrills = [
      {
        title: "Control Orientado y Perfilación",
        description: "Aprende a recibir el balón perfilado hacia la dirección del juego para dar un pase rápido con el segundo toque. Práctica recomendada: 15 repeticiones por pierna.",
        category: "técnica",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        date: "20/06/2026"
      },
      {
        title: "Velocidad de Reacción en Sprints",
        description: "Ejercicio físico para mejorar la salida explosiva en distancias cortas. Haz 4 series de 5 repeticiones con descanso de 30 segundos entre series.",
        category: "físico",
        videoUrl: "https://www.w3schools.com/html/movie.mp4",
        date: "22/06/2026"
      }
    ];

    for (const drill of mockDrills) {
      const drillId = drill.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      await setDoc(doc(db, "drills", drillId), drill);
    }
    console.log("Ejercicios multimedia sembrados.");

    // Cerrar sesión para limpiar el estado de Auth
    await signOut(auth);

    // Marcar como sembrado v2
    await setDoc(seedRef, { seeded_v2: true, date: new Date().toISOString() });
    console.log("Sembrado completado con éxito.");
  } catch (error) {
    console.error("Error en el proceso de sembrado:", error);
  }
}

export { app, auth, db };
