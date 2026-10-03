"use client";

import type { ButtonHTMLAttributes } from "react";
import { useToast } from "./toast";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "overlay";
  feedback?: string;
  size?: "sm" | "md" | "lg";
};

export function ActionButton({
  variant = "primary",
  feedback,
  size = "md",
  className = "",
  onClick,
  children,
  type = "button",
  ...props
}: Props) {
  const { toast } = useToast();

  const look = {
    primary:
      "bg-primary text-primary-fg shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--primary)_70%,transparent)]",
    secondary: "border border-border bg-card text-fg",
    ghost: "text-primary",
    overlay:
      "border border-primary-fg/40 bg-transparent text-primary-fg",
  }[variant];

  const pad = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-[0.95rem]",
  }[size];

  return (
    <button
      type={type}
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-transform disabled:opacity-60 ${look} ${pad} ${className}`}
      onClick={(e) => {
        if (feedback) toast(feedback);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
