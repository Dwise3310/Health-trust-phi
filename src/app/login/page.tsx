import { Suspense } from "react";
import { AuthSlider } from "@/components/auth-slider";
import { HeartbeatLoader } from "@/components/heartbeat-loader";
import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <PublicShell>
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage: "url(/medical/pharmacy.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Hospital desk · pharmacy · membership
          </p>
          <Suspense
            fallback={
              <div className="grid min-h-[400px] place-items-center">
                <HeartbeatLoader label="Opening sign in" />
              </div>
            }
          >
            <AuthSlider />
          </Suspense>
        </div>
      </main>
    </PublicShell>
  );
}
