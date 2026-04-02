"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { registerConfirmDialogShow } from "./confirm-api";
import type {
  ConfirmDialogOptions,
  ResolvedConfirmDialogOptions,
} from "./types";

function resolveOptions(raw: ConfirmDialogOptions): ResolvedConfirmDialogOptions {
  const v = raw.variant;
  const variant: ResolvedConfirmDialogOptions["variant"] =
    v === "danger" ||
    v === "default" ||
    v === "warning" ||
    v === "info"
      ? v
      : "danger";
  return {
    title: raw.title ?? "Xác nhận",
    message: raw.message ?? "",
    confirmLabel: raw.confirmLabel ?? "Đồng ý",
    cancelLabel: raw.cancelLabel ?? "Hủy bỏ",
    icon: raw.icon ?? "",
    variant,
    closeOnBackdrop: raw.closeOnBackdrop ?? true,
    closeOnEscape: raw.closeOnEscape ?? true,
  };
}

type Pending = {
  options: ResolvedConfirmDialogOptions;
  resolve: (value: boolean) => void;
};

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const close = useCallback((value: boolean) => {
    setPending((current) => {
      if (current) current.resolve(value);
      return null;
    });
  }, []);

  const show = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      const resolved = resolveOptions(options);
      setPending({ options: resolved, resolve });
    });
  }, []);

  useEffect(() => {
    registerConfirmDialogShow(show);
    return () => registerConfirmDialogShow(null);
  }, [show]);

  useEffect(() => {
    if (!pending) return;
    const id = requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [pending]);

  useEffect(() => {
    if (!pending?.options.closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending?.options.closeOnEscape, pending, close]);

  useEffect(() => {
    if (!pending) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pending]);

  if (typeof document === "undefined") {
    return <>{children}</>;
  }

  const modal = pending ? (
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center p-4 sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="animate-confirm-backdrop absolute inset-0 bg-slate-900/55 backdrop-blur-md dark:bg-black/70"
        onClick={() => {
          if (pending.options.closeOnBackdrop) close(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="animate-confirm-modal relative z-10 w-[95%] max-w-[400px] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-confirm-modal dark:border-slate-700/90 dark:bg-slate-900 sm:w-[90%] sm:p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          {pending.options.icon ? (
            <div
              className="flex justify-center text-4xl leading-none sm:text-[2.5rem]"
              aria-hidden
            >
              {pending.options.icon}
            </div>
          ) : null}
          <div className="text-center">
            <h2
              id={titleId}
              className="text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl"
            >
              {pending.options.title}
            </h2>
            <p
              id={descId}
              className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[0.9375rem]"
            >
              {pending.options.message}
            </p>
          </div>
          <div className="flex max-[479px]:flex-col-reverse flex-row gap-3 max-[479px]:gap-2.5">
            <button
              ref={cancelRef}
              type="button"
              className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              onClick={() => close(false)}
            >
              {pending.options.cancelLabel}
            </button>
            <button
              type="button"
              className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                pending.options.variant === "danger"
                  ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                  : pending.options.variant === "warning"
                    ? "bg-amber-500 text-slate-900 hover:bg-amber-600 focus-visible:ring-amber-400"
                    : pending.options.variant === "info"
                      ? "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500"
              }`}
              onClick={() => close(true)}
            >
              {pending.options.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {children}
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
