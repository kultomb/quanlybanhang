import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBvdnx8k6_wYb4G5GJT2KDei-y9210zvpg",
  authDomain: "dangnnhap-8687d.firebaseapp.com",
  databaseURL:
    "https://dangnnhap-8687d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dangnnhap-8687d",
  storageBucket: "dangnnhap-8687d.firebasestorage.app",
  messagingSenderId: "13289582447",
  appId: "1:13289582447:web:f69b76d63105e496fc029a",
  measurementId: "G-PLYWMP8CM1",
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
