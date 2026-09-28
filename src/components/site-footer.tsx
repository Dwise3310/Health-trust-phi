import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg">Health Trust</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Making treatment accessible. A healthier and wealthier life, hosted by
            FarmGreat West Africa LLC in partnership with Eastern Ryse Specialist
            Hospital.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Visit</p>
          <p className="mt-2 text-sm text-muted">
            Eastern Ryse Specialist Hospital
            <br />
            Nigeria
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/how-it-works" className="text-muted hover:text-fg">
            How it works
          </Link>
          <Link to="/tiers" className="text-muted hover:text-fg">
            Membership tiers
          </Link>
          <Link to="/contact" className="text-muted hover:text-fg">
            Enquire
          </Link>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        FarmGreat West Africa LLC · Health Trust · Eastern Ryse Specialist Hospital
      </div>
    </footer>
  );
}
