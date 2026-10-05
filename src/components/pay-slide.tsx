"use client";

import { useRef, useState } from "react";

export function PaySlide({
  label,
  onConfirm,
}: {
  label: string;
  onConfirm: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [drag, setDrag] = useState(false);
  const fired = useRef(false);

  function at(clientX: number) {
    const el = track.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxTravel = Math.max(80, rect.width - 52);
    const fromRight = Math.min(maxTravel, Math.max(0, rect.right - 26 - clientX));
    setPull(fromRight);
    if (fromRight >= maxTravel - 10 && !fired.current) {
      fired.current = true;
      setDrag(false);
      onConfirm();
    }
  }

  return (
    <div
      ref={track}
      className="pay-track"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        setDrag(true);
        at(e.clientX);
      }}
      onPointerMove={(e) => drag && at(e.clientX)}
      onPointerUp={() => {
        setDrag(false);
        if (!fired.current) setPull(0);
      }}
    >
      <span className="pay-hint">{label}</span>
      <span
        className="pay-knob pay-knob-right"
        style={{ transform: `translateX(-${pull}px)` }}
      />
    </div>
  );
}
