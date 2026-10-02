"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const [pending, setPending] = useState(false);
  const [label, setLabel] = useState("Loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setPending(false);
  }, []);

  const start = useCallback(
    (nextLabel?: string) => {
      if (nextLabel) setLabel(nextLabel);
      setPending(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setPending(false);
        timer.current = null;
      }, 4200);
    },
    [],
  );

  useEffect(() => {
    stop();
  }, [pathname, stop]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(
    () => ({ start, stop, pending }),
    [start, stop, pending],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {pending ? (
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
