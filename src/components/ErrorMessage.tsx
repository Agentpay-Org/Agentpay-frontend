"use client";

import { memo } from "react";

export type ErrorMessageProps = {
  title: string;
  detail?: string | null;
  requestId?: string;
  onRetry?: () => void;
};

function ErrorMessageInner({ title, detail, requestId, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950"
    >
      <p className="font-medium text-rose-800 dark:text-rose-300">{title}</p>
      {detail && (
        <p className="mt-1 text-rose-700 dark:text-rose-400">{detail}</p>
      )}
      {requestId && (
        <p className="mt-1 font-mono text-xs text-rose-500 dark:text-rose-500">
          Request ID: {requestId}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export const ErrorMessage = memo(ErrorMessageInner);