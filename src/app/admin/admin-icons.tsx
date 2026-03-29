import type { ReactNode } from "react";

/**
 * Icon SVG (stroke) — cùng API className như lucide-react để không bắt buộc cài thêm package.
 */
function Icon({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function Activity({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Icon>
  );
}

export function KeyRound({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M2.586 17.786A2 2 0 0 0 2 19.071V20a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1v-1h1.5l4.5-4.5a2.121 2.121 0 0 0-3-3L2.586 17.786z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
      <path d="M12.5 2.5a5 5 0 1 1-5 5" />
    </Icon>
  );
}

export function Loader2({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </Icon>
  );
}

export function MoreHorizontal({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </Icon>
  );
}

export function RefreshCw({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </Icon>
  );
}

export function Search({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function Shield({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </Icon>
  );
}

export function Store({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m2 7 4.41-4.41a2 2 0 0 1 2.83 0L12 7" />
      <path d="M4 7v12a2 2 0 0 0 2 2h2" />
      <path d="M20 7v12a2 2 0 0 1-2 2h-2" />
      <path d="m22 7-4.41-4.41a2 2 0 0 0-2.83 0L12 7" />
      <path d="M4 7h16" />
      <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
      <path d="M8 7v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" />
    </Icon>
  );
}

export function Trash2({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </Icon>
  );
}

export function Users({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function WifiOff({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
      <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
      <path d="M16.85 11.25a10 10 0 0 1 1.58 3.76" />
      <path d="M5 13a10 10 0 0 1 5.24-2.76" />
    </Icon>
  );
}
