import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Analytics is browser-only; keep login flow simple for now.
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  if (siteKey) {
    import("firebase/app-check")
      .then(({ ReCaptchaV3Provider, initializeAppCheck }) => {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      })
      .catch(() => {
        // Ignore App Check init errors in local/dev environments.
      });
  }

  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => ok && getAnalytics(app)))
    .catch(() => {
      // Ignore analytics initialization errors in local/dev environments.
    });
}

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
