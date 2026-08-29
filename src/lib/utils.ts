import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BestTimeCell } from "@/lib/types";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact number formatting: 1234 -> "1.2K", 1_200_000 -> "1.2M". */
export function formatCompact(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (Math.abs(n) < 1000) return String(Math.round(n));
  if (Math.abs(n) < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  if (Math.abs(n) < 1_000_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `${(n / 1_000_000_000).toFixed(1)}B`;
}

/** Percentage with sign: 12.3 -> "+12.3%", -4 -> "-4%". */
export function formatDelta(n: number): string {
  if (n === 0) return "0%";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Deterministic seeded PRNG (mulberry32) for reproducible mock data. */
export function seededRng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** 24h → "12:00 p.m." */
export function formatTime(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const ampm = h < 12 ? "a.m." : "p.m.";
  const disp = h % 12 === 0 ? 12 : h % 12;
  return `${disp}:00 ${ampm}`;
}

/** Human-readable top time slots, e.g. "lun 12:00 · mié 19:00". */
export function bestTimeSummary(cells: BestTimeCell[], topN = 3): string {
  if (!cells.length) return "sin datos";
  const top = [...cells].sort((a, b) => b.score - a.score).slice(0, topN);
  return top
    .map((c) => {
      const h = c.hour % 24;
      const ampm = h < 12 ? "a.m." : "p.m.";
      const disp = h % 12 === 0 ? 12 : h % 12;
      return `${DAY_NAMES[c.day]} ${disp} ${ampm}`;
    })
    .join(" · ");
}
