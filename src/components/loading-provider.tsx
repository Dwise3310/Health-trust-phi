"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { HeartbeatLoader } from "./heartbeat-loader";

type LoadingContextValue = {
  start: (label?: string) => void;
  stop: () => void;
  pending: boolean;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used inside LoadingProvider");
  }
  return ctx;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState("Loading");

  const start = useCallback((nextLabel?: string) => {
    if (nextLabel) setLabel(nextLabel);
    setCount((n) => n + 1);
  }, []);

  const stop = useCallback(() => {
    setCount((n) => Math.max(0, n - 1));
  }, []);

  useEffect(() => {
    setCount(0);
  }, [pathname]);

  const value = useMemo(
    () => ({ start, stop, pending: count > 0 }),
    [start, stop, count],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {count > 0 ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center"
          style={{
            background: "var(--overlay)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <HeartbeatLoader label={label} />
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}
