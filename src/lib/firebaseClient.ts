"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// These NEXT_PUBLIC_ values are safe to expose in the browser bundle — they
// identify the Firebase project, they are not secrets. Real access control
// happens via Firestore security rules and the server-verified session
// cookie, not by hiding this config.
//
// Initialization is lazy so pages that merely import this module (without
// ever calling clientAuth()) don't crash the build/prerender when Firebase
// env vars aren't set yet.
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

function getClientApp(): FirebaseApp {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return app;
}

export function clientAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getClientApp());
  return authInstance;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(clientAuth(), provider);
}