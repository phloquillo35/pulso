// Suspense fallback for every route inside the (app) segment. A lightweight
// skeleton that mirrors the real layout so navigation feels instant.
export default function Loading() {
  return (
    <div>
      <div className="mt-6 h-10 w-56 animate-pulse rounded-[12px] bg-[var(--surface-2)]" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)] lg:col-span-2" />
      </div>
      <div className="mt-4 h-40 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)]" />
    </div>
  );
}
