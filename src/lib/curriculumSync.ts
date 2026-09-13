import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import curriculumData from '../data/curriculum_matematyka.json';
import { SystemMeta } from '../schema_firestore';

export const LOCAL_CURRICULUM_VERSION = (curriculumData as any).version || "2.0.0";

let hasCheckedSystemMeta = false;
let cachedResult: { upToDate: boolean; serverVersion: string } | null = null;

/**
 * Rule 1: Checks system/meta version from Firestore.
 * Performs at most 1 single document read per session.
 * If the local version matches the server -> 0 additional queries to Firestore!
 * All tasks and theory are loaded instantly from local curriculum_matematyka.json.
 */
export async function checkSystemMetaVersion(): Promise<{ upToDate: boolean; serverVersion: string }> {
  if (hasCheckedSystemMeta && cachedResult) {
    return cachedResult;
  }

  try {
    const metaRef = doc(db, 'system', 'meta');
    const snap = await getDoc(metaRef);

    if (snap.exists()) {
      const data = snap.data() as SystemMeta;
      const serverVersion = data.curriculumVersion || LOCAL_CURRICULUM_VERSION;
      hasCheckedSystemMeta = true;
      cachedResult = {
        upToDate: serverVersion === LOCAL_CURRICULUM_VERSION,
        serverVersion
      };
      return cachedResult;
    } else {
      // First-time setup: initialize system/meta document if absent
      try {
        await setDoc(metaRef, {
          curriculumVersion: LOCAL_CURRICULUM_VERSION,
          systemName: (curriculumData as any).system_name || "Egzamin Ósmoklasisty CKE",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (writeErr) {
        // Non-blocking in case of restricted permissions
      }

      hasCheckedSystemMeta = true;
      cachedResult = { upToDate: true, serverVersion: LOCAL_CURRICULUM_VERSION };
      return cachedResult;
    }
  } catch (err) {
    // Offline or network latency: fallback cleanly to local data with zero delay and zero crash
    hasCheckedSystemMeta = true;
    cachedResult = { upToDate: true, serverVersion: LOCAL_CURRICULUM_VERSION };
    return cachedResult;
  }
}
