import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { mathTopics } from '../src/data/mathTasks';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log('Seeding mathTasks to Firestore...');
  try {
    for (const topic of mathTopics) {
      const docRef = doc(db, 'mathTasks', topic.id);
      await setDoc(docRef, topic);
      console.log(`Successfully seeded: ${topic.name}`);
    }
    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tasks:', error);
    process.exit(1);
  }
}

seed();
