"use client";

import {
  Banknote,
  CalendarDays,
  Crown,
  Gift,
  House,
  LayoutGrid,
  Pill,
  Settings,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HOSPITAL } from "@/lib/constants";
import { NavLink } from "./nav-link";

type Item = { href: string; label: string; icon: LucideIcon };

const BAR: Item[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/appointments", label: "Visit", icon: CalendarDays },
  { href: "/dashboard/membership", label: "Care", icon: Crown },
];

const MORE: Item[] = [
  { href: "/dashboard/products", label: "Pharmacy", icon: Pill },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: Banknote },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/missions", label: "Missions", icon: LayoutGrid },
  { href: "/dashboard/profile", label: "Patient file", icon: UserRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Home", icon: House }],
  },
  {
    title: "Money",
    items: [
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
      { href: "/dashboard/withdraw", label: "Withdraw", icon: Banknote },
    ],
  },
  {
    title: "Care",
    items: [
      { href: "/dashboard/appointments", label: "Visit", icon: CalendarDays },
      { href: "/dashboard/membership", label: "Membership", icon: Crown },
      { href: "/dashboard/products", label: "Pharmacy", icon: Pill },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/profile", label: "Patient file", icon: UserRound },
      { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
      { href: "/dashboard/missions", label: "Missions", icon: LayoutGrid },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(path: string, href: string) {
  if (href === "/dashboard") return path === "/dashboard";
  return path === href || path.startsWith(`${href}/`);
}

export function DashDock() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const onMore = MORE.some((i) => isActive(path, i.href));
  const barIndex = BAR.findIndex((i) => isActive(path, i.href));
  const slide = more || onMore || barIndex < 0 ? 4 : barIndex;

  useEffect(() => {
    setMore(false);
  }, [path]);

  useEffect(() => {
    if (!more) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMore(false);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [more]);

  return (
    <>
      {more ? (
        <div className="more-sheet" onClick={() => setMore(false)}>
          <div
            className="more-panel"
            role="dialog"
            aria-label="More pages"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                More
              </p>
              <button
                type="button"
                onClick={() => setMore(false)}
                className="px-3 py-1 text-sm text-muted"
              >
                Close
              </button>
            </div>
            {MORE.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                press={false}
                onClick={() => setMore(false)}
                className={`more-link ${isActive(path, item.href) ? "is-on" : ""}`}
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      <nav className="dash-dock" aria-label="Member desk">
        <span className="dock-slide" style={{ transform: `translateX(${slide * 100}%)` }}>
          <i />
        </span>
        {BAR.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            press={false}
            aria-current={isActive(path, item.href) ? "page" : undefined}
            className={isActive(path, item.href) ? "is-on" : ""}
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          className={`dock-item ${onMore || more ? "is-on" : ""}`}
          aria-expanded={more}
          onClick={() => setMore((v) => !v)}
        >
          <LayoutGrid className="size-5" />
          More
        </button>
      </nav>
    </>
  );
}

export function DashSidebar() {
  const path = usePathname();

  return (
    <aside className="side-rail" aria-label="Member desk">
      <NavLink href="/" press={false} className="flex items-center gap-3 px-2">
        <span className="grid size-9 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-fg">
          SH
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">{HOSPITAL.program}</span>
          <span className="block text-[11px] text-muted">Member desk</span>
        </span>
      </NavLink>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {section.title}
          </p>
          <ul className="mt-2 grid">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  press={false}
                  aria-current={isActive(path, item.href) ? "page" : undefined}
                  className={`side-link ${isActive(path, item.href) ? "is-on" : ""}`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
