"use client";

import { useEffect, useRef, useState } from "react";
import { ActionButton } from "./action-button";

export function OtpModal({
  email,
  open,
  onClose,
  onVerified,
  sendCode,
  verifyCode,
}: {
  email: string;
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  sendCode: () => Promise<string | null>;
  verifyCode: (code: string) => Promise<boolean>;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "bad">("idle");
  const [hint, setHint] = useState("Enter the 4-digit code sent to your email");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    setDigits(["", "", "", ""]);
    setStatus("idle");
    setHint("Enter the 4-digit code sent to your email");
    setSeconds(30);
    const t = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    setTimeout(() => refs.current[0]?.focus(), 180);
    return () => clearInterval(t);
  }, [open]);

  if (!open) return null;

  const code = digits.join("");

  async function verify() {
    if (code.length < 4 || busy) return;
    setBusy(true);
    const ok = await verifyCode(code);
    setStatus(ok ? "ok" : "bad");
    setHint(
      ok
        ? "Email confirmed. You can finish creating the account."
        : "That code did not match. Try again.",
    );
    setBusy(false);
    if (ok) {
      setTimeout(() => onVerified(), 900);
    }
  }

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-fg/35"
        aria-label="Close verification"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <p className="text-xs font-semibold tracking-wide text-bronze">
          Email check
        </p>
        <h2 className="mt-1 text-2xl">Verify your email</h2>
        <p className="mt-2 text-sm text-muted">
          Code sent to {email}. {hint}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="otp-box"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                const next = [...digits];
                next[i] = v;
                setDigits(next);
                if (v && i < 3) refs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) {
                  refs.current[i - 1]?.focus();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData
                  .getData("text")
                  .replace(/\D/g, "")
                  .slice(0, 4)
                  .split("");
                const next = ["", "", "", ""];
                pasted.forEach((ch, idx) => {
                  next[idx] = ch;
                });
                setDigits(next);
                refs.current[Math.min(pasted.length, 3)]?.focus();
              }}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        <div className="mt-6 grid gap-2">
          <ActionButton
            variant="primary"
            onClick={verify}
            disabled={busy || code.length < 4}
            feedback={status === "ok" ? "Email verified" : undefined}
          >
            {busy ? "Checking code..." : status === "ok" ? "Verified" : "Verify code"}
          </ActionButton>
          {seconds > 0 ? (
            <p className="text-center text-xs text-muted">
              Resend in 00:{seconds < 10 ? `0${seconds}` : seconds}
            </p>
          ) : (
            <ActionButton
              variant="ghost"
              onClick={async () => {
                const msg = await sendCode();
                setSeconds(30);
                setHint(msg || "A new code is on the way.");
              }}
            >
              Resend code
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
