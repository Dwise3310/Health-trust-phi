# Health Trust — automatic email list

Emails members should receive automatically once Resend (or another provider) is connected.
Work through each item later; this file is the checklist only.

## Auth

1. **Signup verification OTP** — 6-digit (or link) code when a new account is created.
2. **Welcome email** — after email is verified / first successful login.
3. **Password reset** — OTP or magic link when the user requests a reset.
4. **Password changed confirmation** — security notice after a successful reset.
5. **New login alert (optional)** — new device / unusual location notice.

## Membership & wallet

6. **Subscription confirmed** — Base / Plus / Prime joined (tier, amount, start, end).
7. **Upgrade confirmed** — previous plan closed, new tier + residual months.
8. **Plan expiring soon** — reminder ~14 days and ~3 days before `expires_at`.
9. **Plan expired** — Care Quota deactivated; how to renew.
10. **Care Quota refreshed** — every 3-month auto-refresh to 100%.
11. **Wallet funded** — amount credited, new balance, reference.
12. **Wallet debit** — subscription, appointment, card purchase summary.
13. **Low balance warning** — balance below a tier price or threshold.

## Care Quota codes

14. **Code generated** — code string, allocated %, remaining %, how to present at hospital.
15. **Code used / debited** — staff debit notification to code owner (amount, facility note).
16. **Code exhausted** — remaining hit 0%.
17. **Code cancelled** — member cancelled an active code.

## Appointments & cards

18. **Appointment booked** — kind, duration, time, Health cost.
19. **Appointment reminder** — 24h and 2h before `scheduled_at`.
20. **Appointment cancelled / completed** — status change notice.
21. **Appointment card purchased** — normal / VIP card confirmation.

## Referrals

22. **Referral bonus earned** — when a referred user subscribes (percent + Health amount).
23. **You were referred successfully** — optional thank-you to the new member.

## Support & hospital

24. **Enquiry received** — auto-reply to contact form submitter.
25. **Enquiry to ops** — internal copy to Hospital / FarmGreat inbox.
26. **New hospital update published** — optional newsletter to active members.

## Admin / staff

27. **Staff invite** — when role is set to staff / super_admin.
28. **Audit-sensitive action** — high-risk debit or role change notice to super_admin.

## Provider notes

- Preferred provider: **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`).
- Until a domain is verified, use Resend’s `onboarding@resend.dev` for testing only.
- Store templates in code or Resend dashboard; keep copy short and brand-consistent.
