const ROW_STYLES = [
  "h-6 w-40",
  "h-4 w-80",
  "h-4 w-72",
  "h-4 w-64",
];

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  const rowCount = Math.max(1, rows);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[60vh] max-w-3xl p-8 focus:outline-none"
    >
      {/*
        Announce the route transition to assistive technology (WCAG 4.1.3).
        The status region carries an sr-only label so screen-reader users hear
        the loading label while the visual skeleton - hidden from the a11y tree - keeps
        sighted users oriented. The pulse animation is disabled via
        prefers-reduced-motion in globals.css.
      */}
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="flex flex-col gap-4"
      >
        <span className="sr-only">Loading…</span>
        {Array.from({ length: rowCount }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`${ROW_STYLES[index % ROW_STYLES.length]} animate-pulse rounded bg-zinc-200 dark:bg-zinc-800`}
          />
        ))}
      </div>
    </main>
  );
}
