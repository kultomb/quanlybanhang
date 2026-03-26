import admin from "firebase-admin";

const databaseURL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://dangnnhap-8687d-default-rtdb.asia-southeast1.firebasedatabase.app";

function getServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS || "";
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const svc = getServiceAccount();
  if (!svc) {
    throw new Error("Missing FIREBASE_ADMIN_CREDENTIALS");
  }
  return admin.initializeApp({
    credential: admin.credential.cert(svc),
    databaseURL,
  });
}

export function adminDb() {
  return admin.database(getAdminApp());
}
