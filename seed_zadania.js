import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

import { zadania_matura } from './src/data/zadania_matura.js'; // wait, it's .ts

async function run() {
  const tasksRef = collection(db, 'zadania_matura');
  for (const task of zadania_matura) {
    await setDoc(doc(tasksRef, task.id), task);
    console.log(`Seeded task ${task.id}`);
  }
  console.log("All done!");
  process.exit(0);
}

run();
