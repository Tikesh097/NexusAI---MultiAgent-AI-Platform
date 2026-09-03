import dotenv from "dotenv";
dotenv.config();

import { initializeApp, cert } from "firebase-admin";

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};


if (!serviceAccount.projectId) {
  throw new Error("FIREBASE_PROJECT_ID is missing");
}

if (!serviceAccount.clientEmail) {
  throw new Error("FIREBASE_CLIENT_EMAIL is missing");
}

if (!serviceAccount.privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is missing");
}

export const app = initializeApp({
  credential: cert(serviceAccount),
});

