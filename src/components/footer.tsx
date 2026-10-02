"use client";

import { HOSPITAL } from "@/lib/constants";
import { NavLink } from "./nav-link";

const LEGAL = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/refund", label: "Refund policy" },
  { href: "/cookies", label: "Cookie policy" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/business", label: "Business details" },
  { href: "/age-policy", label: "Age and children's data" },
  { href: "/licenses", label: "Licenses" },
  { href: "/data-deletion", label: "Delete my data" },
  { href: "/unsubscribe", label: "Unsubscribe" },
  { href: "/fees", label: "Fees" },
  { href: "/claims", label: "How we speak" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="serif text-xl">{HOSPITAL.program}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            A membership that puts consultation and diagnosis inside a Care
            Quota at {HOSPITAL.name}. Sponsored by {HOSPITAL.sponsor}. Built
            so treatment is easier to reach, and so a healthier life can also
            be a wealthier one.
          </p>
          <p className="mt-4 text-xs text-muted">
            This site does not replace emergency care. If you are in danger,
            call local emergency services first.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Visit</p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            <NavLink href="/how-it-works">How Care Quota works</NavLink>
            <NavLink href="/tiers">Membership tiers</NavLink>
            <NavLink href="/referrals">Referral cashback</NavLink>
            <NavLink href="/contact">Ask a question</NavLink>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            {LEGAL.slice(0, 6).map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            {HOSPITAL.program} · {HOSPITAL.sponsor} · {HOSPITAL.country}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL.slice(6).map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
