import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

// Need to import the mathTopics. Since it's typescript, we can just compile it or extract it.
// Actually it's easier to just copy the data or read it and eval it.
