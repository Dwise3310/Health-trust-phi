import { Suspense } from "react";
import { AuthSlider } from "@/components/auth-slider";
import { HeartbeatLoader } from "@/components/heartbeat-loader";
import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="grid min-h-[400px] place-items-center">
              <HeartbeatLoader label="Opening sign in" />
            </div>
          }
        >
          <AuthSlider />
        </Suspense>
      </main>
    </PublicShell>
  );
}
