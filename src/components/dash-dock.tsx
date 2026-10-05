"use client";

import {
  Banknote,
  CalendarDays,
  Crown,
  Gift,
  LayoutGrid,
  Settings,
  ShoppingCart,
  UserRound,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavLink } from "./nav-link";

const MAIN = [
  { href: "/dashboard", label: "File", icon: UserRound },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
];

const MORE = [
  { href: "/dashboard/membership", label: "Membership", icon: Crown },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: Banknote },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/missions", label: "Missions", icon: LayoutGrid },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashDock() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const onMore = MORE.some((i) => path.startsWith(i.href));

  return (
    <>
      {more ? (
        <div className="more-sheet" onClick={() => setMore(false)}>
          <div className="more-panel" onClick={(e) => e.stopPropagation()}>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              More
            </p>
            {MORE.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onClick={() => setMore(false)}
                className={`flex items-center gap-3 px-3 py-3 text-sm ${
                  path.startsWith(item.href) ? "text-primary" : ""
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      <nav className="dash-dock" aria-label="Member desk">
        {MAIN.map((item) => {
          const on = path === item.href;
          return (
            <NavLink key={item.href} href={item.href} className={on ? "is-on" : ""}>
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          );
        })}
        <NavLink
          href="/dashboard/products"
          className={`dash-dock-center ${
            path.startsWith("/dashboard/products") ? "is-on" : ""
          }`}
          aria-label="Cart"
        >
          <ShoppingCart className="size-5" />
        </NavLink>
        <NavLink
          href="/dashboard/appointments"
          className={path.startsWith("/dashboard/appointments") ? "is-on" : ""}
        >
          <CalendarDays className="size-5" />
          Visit
        </NavLink>
        <button
          type="button"
          className={`dock-item ${onMore || more ? "is-on" : ""}`}
          onClick={() => setMore((v) => !v)}
        >
          <LayoutGrid className="size-5" />
          More
        </button>
      </nav>
    </>
  );
}
