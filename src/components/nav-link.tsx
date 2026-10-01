"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { useLoading } from "./loading-provider";

type Props = LinkProps & {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function NavLink({ children, className, onClick, ...props }: Props) {
  const { start } = useLoading();
  return (
    <Link
      {...props}
      className={className}
      onClick={() => {
        start("Opening page");
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
