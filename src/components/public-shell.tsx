"use client";

import { Footer } from "./footer";
import { Header } from "./header";

export function PublicShell({
  children,
  signedIn,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <Header signedIn={signedIn} />
      {children}
      <Footer />
    </div>
  );
}
