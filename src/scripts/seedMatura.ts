import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { zadania_matura } from '../data/zadania_matura';

export const seedMaturaTasks = async () => {
  try {
    console.log("Seeding matura tasks...");
    const tasksRef = collection(db, 'zadania_matura');
    for (const task of zadania_matura) {
      await setDoc(doc(tasksRef, task.id), task);
    }
    console.log("Matura tasks seeded successfully!");
  } catch (error) {
    console.error("Error seeding matura tasks:", error);
  }
};
