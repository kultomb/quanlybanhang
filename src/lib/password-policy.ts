/** Client-side policy before Firebase Auth; reduces weak / breached-style passwords. */

const BLOCKED = new Set(
  [
    "password",
    "password1",
    "password123",
    "passw0rd",
    "123456",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty",
    "abc123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "sunshine",
    "princess",
    "football",
    "iloveyou",
    "654321",
    "111111",
    "000000",
    "matkhau",
    "matkhau123",
    "anhyeuem",
    "khongbiet",
  ].map((s) => s.toLowerCase()),
);

export type PasswordCheck = { ok: true } | { ok: false; message: string };

export function validateSignupPassword(password: string, email?: string): PasswordCheck {
  if (password.length < 8) {
    return { ok: false, message: "Mật khẩu cần ít nhất 8 ký tự." };
  }
  if (password.length > 128) {
    return { ok: false, message: "Mật khẩu quá dài (tối đa 128 ký tự)." };
  }

  const lower = password.toLowerCase();
  if (BLOCKED.has(lower)) {
    return {
      ok: false,
      message: "Mật khẩu này quá phổ biến hoặc dễ đoán. Hãy chọn mật khẩu khác.",
    };
  }

  if (/^(.)\1{7,}$/.test(password)) {
    return { ok: false, message: "Không dùng mật khẩu lặp lại một ký tự." };
  }

  const hasLetter = /\p{L}/u.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^\p{L}\d\s]/u.test(password);
  if (!(hasLetter && (hasDigit || hasSymbol))) {
    return {
      ok: false,
      message: "Nên kết hợp chữ cái với số hoặc ký tự đặc biệt (ví dụ: ! @ #).",
    };
  }

  const local = String(email?.split("@")[0] || "")
    .trim()
    .toLowerCase();
  if (local.length >= 3 && lower.includes(local)) {
    return { ok: false, message: "Không dùng email hoặc phần trước @ làm mật khẩu." };
  }

  return { ok: true };
}
