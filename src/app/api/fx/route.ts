import { NextResponse } from "next/server";

export const revalidate = 1800;

type Rates = { usd: number; eur: number; asOf: string };

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN", {
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error("fx");
    const data = (await res.json()) as {
      rates?: { USD?: number; EUR?: number };
      time_last_update_utc?: string;
    };
    const usd = Number(data.rates?.USD);
    const eur = Number(data.rates?.EUR);
    if (!usd || !eur) throw new Error("missing");
    const body: Rates = {
      usd,
      eur,
      asOf: data.time_last_update_utc || new Date().toUTCString(),
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Live FX is unavailable right now." },
      { status: 502 },
    );
  }
}
