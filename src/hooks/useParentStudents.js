import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useParentStudents(studentIds = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = [...new Set((Array.isArray(studentIds) ? studentIds : []).filter(Boolean))];
    if (ids.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const records = new Map();
    const unsubscribers = ids.map((studentId) => {
      const ref = doc(db, "students", studentId);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          records.set(studentId, {
            id: snap.id,
            studentId,
            ...snap.data()
          });
        } else {
          records.delete(studentId);
        }
        setData(ids.map((id) => records.get(id)).filter(Boolean));
        setLoading(false);
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [studentIds.join("|")]);

  return { data, loading };
}

export default useParentStudents;
