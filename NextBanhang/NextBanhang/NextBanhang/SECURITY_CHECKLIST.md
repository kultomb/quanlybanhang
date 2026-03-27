# Security checklist before commercial release

## 1) Realtime Database rules
- Deploy `firebase.database.rules.json` to Firebase Realtime Database.
- Never use global `"read": true` / `"write": true` in production.

## 2) Session and data proxy
- Legacy app no longer sends ID token in URL/localStorage.
- `HttpOnly` cookie is set by `POST /api/auth/session`.
- Realtime Database requests are proxied by `GET/PUT/DELETE /api/rtdb/**`.

## 3) App Check
- Set `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` in environment variables.
- App Check is auto-initialized in `src/lib/firebase.ts` when site key is present.
- In Firebase Console, enable App Check enforcement for Realtime Database/Auth as rollout step.

## 4) Domain restrictions
- In Firebase Authentication -> Authorized domains, keep only trusted domains:
  - production domain
  - preview domain if needed
  - localhost for dev

## 5) Abuse monitoring
- Enable Firebase alerts and billing threshold alerts.
- Track spikes in failed logins and RTDB traffic.
- Review logs weekly before scaling.

## 6) Sensitive data policy
- Avoid storing customer device/password secrets in plaintext.
- If business requires storing sensitive secrets, move encryption/decryption to server.

## 7) Auto payment activation
- Configure webhook endpoint: `POST /api/payment/webhook`
- Set `PAYMENT_WEBHOOK_SECRET` and send it as `x-webhook-secret`.
- Set `FIREBASE_ADMIN_CREDENTIALS` (service account JSON string).
- Payment matching logic:
  - amount >= `NEXT_PUBLIC_PAYMENT_AMOUNT`
  - transfer content must contain `users/{uid}/paymentRef`
  - matched user is auto-updated to `paymentStatus: active`

