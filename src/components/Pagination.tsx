"use client";

import { memo, useCallback, useState } from "react";
import { useDebounce } from "@/lib/useDebounce";
import { ErrorMessage } from "./ErrorMessage";
import { Spinner } from "./Spinner";

type Props = {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
  /** Shows a loading indicator in place of the nav controls. */
  loading?: boolean;
  /** Shows an error state (with retry, if `onRetry` is given) in place of
   * the nav controls. Takes precedence over `loading`. */
  error?: string | null;
  /** Called when the error state's retry action is activated. Only
   * rendered as a button when both `error` and `onRetry` are set. */
  onRetry?: () => void;
};

const ANNOUNCEMENT_DEBOUNCE_MS = 300;

function PaginationInner({
  page,
  pageCount,
  onChange,
  loading = false,
  error = null,
  onRetry,
}: Props) {
  // Debounce the announced page so rapid successive changes (e.g. fast
  // repeat clicks) collapse into a single announcement for the page the
  // user settles on, instead of queuing one per intermediate change.
  const debouncedPage = useDebounce(page, ANNOUNCEMENT_DEBOUNCE_MS);
  const [previousAnnouncedPage, setPreviousAnnouncedPage] = useState(debouncedPage);
  const [announcement, setAnnouncement] = useState("");

  // Keep the first committed live region empty, then update it in the same
  // commit as each later debounced page change.
  if (debouncedPage !== previousAnnouncedPage) {
    setPreviousAnnouncedPage(debouncedPage);
    setAnnouncement(pageCount > 1 ? `Page ${debouncedPage} of ${pageCount}` : "");
  }

  const goToPrevious = useCallback(() => {
    onChange(Math.max(1, page - 1));
  }, [onChange, page]);

  const goToNext = useCallback(() => {
    onChange(Math.min(pageCount, page + 1));
  }, [onChange, page, pageCount]);

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load page"
        detail={error}
        onRetry={onRetry}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-2">
        <Spinner label="Loading page" />
      </div>
    );
  }

  if (pageCount <= 1) return null;

  const showResultCount =
    totalItems !== undefined && pageSize !== undefined;
  const visibleSummary = showResultCount
    ? resultRangeSummary(page, totalItems, pageSize)
    : null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 text-sm">
      {showFirstLast ? (
        <button
          type="button"
          onClick={goToFirst}
          disabled={page <= 1}
          className={buttonClassName}
        >
          First
        </button>
      ) : null}
      <button
        type="button"
        onClick={goToPrevious}
        disabled={page <= 1}
        className={buttonClassName}
      >
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
        {visibleSummary ? (
          <span className="ml-2 text-zinc-600 dark:text-zinc-400">
            {visibleSummary}
          </span>
        ) : null}
      </span>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <button
        type="button"
        onClick={goToNext}
        disabled={page >= pageCount}
        className={buttonClassName}
      >
        Next
      </button>
      {showFirstLast ? (
        <button
          type="button"
          onClick={goToLast}
          disabled={page >= pageCount}
          className={buttonClassName}
        >
          Last
        </button>
      ) : null}
    </nav>
  );
}

/**
 * Memoized so a parent re-rendering for unrelated state (e.g. a toast or
 * theme change elsewhere on the page) does not force this component to
 * re-render when its own props haven't changed.
 */
export const Pagination = memo(PaginationInner);
