import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

function trimEnv(v: string | undefined) {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Bắt buộc dùng `process.env.NEXT_PUBLIC_*` trực tiếp (không `process.env[name]`).
 * Next/Webpack chỉ thay thế tĩnh các literal đó vào bundle trình duyệt; truy cập động → luôn rỗng → auth/invalid-api-key hoặc báo thiếu env.
 */
function readFirebaseWebConfig() {
  const apiKey = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const authDomain = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const databaseURL = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
  const projectId = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const storageBucket = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
  const appId = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
  const missing: string[] = [];
  if (!apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!databaseURL) missing.push("NEXT_PUBLIC_FIREBASE_DATABASE_URL");
  if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  if (missing.length > 0) {
    throw new Error(
      `[Hangho] Thiếu biến môi trường cho đăng nhập / đồng bộ: ${missing.join(", ")}. ` +
        "Tạo .env.local ở thư mục gốc, điền đủ NEXT_PUBLIC_FIREBASE_* (bảng điều khiển dự án → Project settings → Web app). " +
        "Sau đó dừng dev server, xóa thư mục .next nếu cần, rồi chạy lại npm run dev.",
    );
  }
  const measurementRaw = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  const measurementId =
    typeof measurementRaw === "string" && measurementRaw.trim() ? measurementRaw.trim() : undefined;
  return {
    apiKey,
    authDomain,
    databaseURL,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

const app = getApps().length ? getApp() : initializeApp(readFirebaseWebConfig());

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
if (typeof window !== "undefined") {
  auth.languageCode = "vi";
}
export const rtdb = getDatabase(app);
export const db = getFirestore(app);
