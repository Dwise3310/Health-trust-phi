"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function SiteBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const supabase = createClient();
    if (!supabase) return;
    void supabase.rpc("sh_track_view", { p_path: pathname });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void supabase.rpc("sh_touch_member");
    });
  }, [pathname]);

  return null;
}
