"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLoading } from "./loading-provider";

type Props = LinkProps & {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

function pathOf(href: LinkProps["href"]) {
  if (typeof href === "string") return href.split("?")[0];
  return href.pathname || "/";
}

export function NavLink({ children, className, onClick, href, ...props }: Props) {
  const { start } = useLoading();
  const pathname = usePathname();

  return (
    <Link
      href={href}
      {...props}
      className={`btn-press ${className ?? ""}`}
      onClick={() => {
        const next = pathOf(href);
        if (next !== pathname) start("Opening page");
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
