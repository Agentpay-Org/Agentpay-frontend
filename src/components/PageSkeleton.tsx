export function PageSkeleton() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[60vh] max-w-3xl p-8 focus:outline-none"
    >
      {/*
        Announce the route transition to assistive technology (WCAG 4.1.3).
        The status region carries an sr-only label so screen-reader users hear
        "Loading…" while the visual skeleton — hidden from the a11y tree — keeps
        sighted users oriented. The pulse animation is disabled via
        prefers-reduced-motion in globals.css.
      */}
      <div role="status" aria-live="polite" className="flex flex-col gap-4">
        <span className="sr-only">Loading…</span>
        <div
          aria-hidden="true"
          className="h-6 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        />
        <div
          aria-hidden="true"
          className="h-4 w-80 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        />
        <div
          aria-hidden="true"
          className="h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        />
      </div>
    </main>
  );
}
