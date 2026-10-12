export const ADMIN_NAV = [
  { id: "analytics", label: "Analytics", perm: "analytics.view" },
  { id: "withdraw", label: "Withdrawals", perm: "withdrawals.manage" },
  { id: "visit", label: "Visits", perm: "visits.manage" },
  { id: "pharmacy", label: "Pharmacy", perm: "pharmacy.manage" },
  { id: "card", label: "Cards", perm: "cards.manage" },
  { id: "enquiry", label: "Enquiries", perm: "enquiries.reply" },
  { id: "deletion", label: "Deletions", perm: "deletions.manage" },
  { id: "reception", label: "Reception", perm: "codes.check" },
  { id: "patients", label: "Patients", perm: "patients.view" },
  { id: "roles", label: "Roles", perm: "roles.manage" },
  { id: "logo", label: "Logo", perm: "branding.manage" },
  { id: "audit", label: "Audit", perm: "audit.view" },
] as const;

export type AdminSection = (typeof ADMIN_NAV)[number]["id"];

export const ADMIN_PERMISSIONS: { id: string; label: string }[] = [
  { id: "analytics.view", label: "Analytics" },
  { id: "withdrawals.manage", label: "Withdrawals" },
  { id: "visits.manage", label: "Visits and calls" },
  { id: "pharmacy.manage", label: "Pharmacy orders" },
  { id: "cards.manage", label: "Appointment cards" },
  { id: "enquiries.reply", label: "Enquiries" },
  { id: "deletions.manage", label: "Data deletion" },
  { id: "codes.check", label: "Reception code check" },
  { id: "patients.view", label: "Patient folders" },
  { id: "records.write", label: "Write the chart" },
  { id: "roles.manage", label: "Roles and invites" },
  { id: "branding.manage", label: "Logo" },
  { id: "audit.view", label: "Audit log" },
];

export type AdminStatus = {
  allowed: boolean;
  super?: boolean;
  email?: string;
  name?: string;
  permissions?: string[];
  totp_enabled?: boolean;
  verified?: boolean;
};

export function canSee(status: AdminStatus, perm: string) {
  if (status.super) return true;
  return (status.permissions || []).includes(perm);
}
