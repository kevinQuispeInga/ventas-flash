import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
const env = import.meta.env;
export const backend = env.VITE_BACKEND || "firebase";
export function firebaseClient() {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  if (Object.values(config).some((v) => !v))
    throw new Error(
      "Falta configurar Firebase. Completa .env.local siguiendo docs/firebase-setup.md, o usa VITE_BACKEND=demo.",
    );
  const existed = getApps().length > 0;
  const app = getApps()[0] || initializeApp(config);
  const auth = getAuth(app),
    db = getFirestore(app),
    functions = getFunctions(
      app,
      env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1",
    ),
    storage = getStorage(app);
  if (env.VITE_USE_FIREBASE_EMULATORS === "true" && !existed) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }
  return { auth, db, functions, storage };
}
