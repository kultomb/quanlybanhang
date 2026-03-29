import Link from "next/link";

type Props = {
  href?: string;
  /** Landing dùng lớn hơn một chút */
  variant?: "landing" | "compact";
};

export function HanghoLogoLink({ href = "/", variant = "landing" }: Props) {
  const fontSize =
    variant === "landing" ? "clamp(16px, 4.2vw, 18px)" : "clamp(15px, 4vw, 17px)";
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontWeight: 800,
          fontSize,
          color: "#065f46",
          letterSpacing: "-0.02em",
        }}
      >
        Hangho.com
      </span>
    </Link>
  );
}
