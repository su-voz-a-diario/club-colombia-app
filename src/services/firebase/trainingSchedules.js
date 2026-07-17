import { db } from "@/lib/firebase";
import { normalizeTrainingSchedule, sortTrainingSchedules } from "@/lib/trainingScheduleModel";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

export function subscribeTrainingSchedules(callback, onError) {
  const unsubscribe = onSnapshot(collection(db, "trainingSchedules"), (snapshot) => {
    const schedules = [];
    snapshot.forEach((scheduleDoc) => {
      schedules.push({ id: scheduleDoc.id, ...scheduleDoc.data() });
    });
    callback(schedules.sort(sortTrainingSchedules));
  }, (err) => {
    if (onError) onError(err);
  });

  return unsubscribe;
}

export function subscribeCoachUsers(callback, onError) {
  const coachesQuery = query(collection(db, "users"), where("status", "==", "active"));
  const unsubscribe = onSnapshot(coachesQuery, (snapshot) => {
    const coaches = [];
    snapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
      if (roles.includes("coach")) {
        coaches.push({
          uid: user.uid || userDoc.id,
          id: userDoc.id,
          name: user.name || user.displayName || user.email || "Entrenador",
          email: user.email || ""
        });
      }
    });
    callback(coaches.sort((a, b) => a.name.localeCompare(b.name)));
  }, (err) => {
    if (onError) onError(err);
  });

  return unsubscribe;
}

export async function saveTrainingSchedule(scheduleData, scheduleId = null) {
  const normalized = normalizeTrainingSchedule(scheduleData);
  if (!normalized.title || !normalized.category || !normalized.location || Number.isNaN(normalized.dayOfWeek) || !normalized.startTime) {
    throw new Error("Completa título, día, hora de inicio, categoría y sede.");
  }

  const scheduleRef = scheduleId
    ? doc(db, "trainingSchedules", scheduleId)
    : doc(collection(db, "trainingSchedules"));

  await setDoc(scheduleRef, {
    ...normalized,
    updatedAt: serverTimestamp(),
    ...(scheduleId ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });

  return { success: true, scheduleId: scheduleRef.id };
}

export async function updateTrainingScheduleStatus(scheduleId, active) {
  if (!scheduleId) throw new Error("ID de horario requerido");
  await updateDoc(doc(db, "trainingSchedules", scheduleId), {
    active: active === true,
    updatedAt: serverTimestamp()
  });
  return { success: true };
}

export async function deleteTrainingSchedule(scheduleId) {
  if (!scheduleId) throw new Error("ID de horario requerido");
  await deleteDoc(doc(db, "trainingSchedules", scheduleId));
  return { success: true };
}
