"use client";

import { useMemo, useState, type ReactNode } from "react";

type Align = "left" | "center" | "right";
type SortDirection = "ascending" | "descending";

type BaseColumn<T> = {
  /** Stable identifier for the column; also used as the sort key. */
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  /** Renders the cell as `<th scope="row">` instead of `<td>`. */
  rowHeader?: boolean;
  align?: Align;
  headerClassName?: string;
  cellClassName?: string;
};

type SortableColumn<T> = BaseColumn<T> & {
  sortable: true;
  /** Returns the comparable value used to order rows by this column. */
  sortAccessor: (row: T) => string | number;
};

type UnsortableColumn<T> = BaseColumn<T> & {
  sortable?: false;
};

export type DataTableColumn<T> = SortableColumn<T> | UnsortableColumn<T>;

export type DataTableProps<T> = {
  /** Accessible table summary, rendered as a visible `<caption>`. */
  caption: ReactNode;
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  className?: string;
  captionClassName?: string;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
};

const ALIGN_CLASSES: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block text-[0.65rem] leading-none ${
        active ? "opacity-100" : "opacity-30"
      }`}
    >
      {active && direction === "descending" ? "▼" : "▲"}
    </span>
  );
}

/**
 * Shared table primitive with typed columns, a visible caption, `scope`
 * attributes on header cells, and optional client-side sorting that reflects
 * the active column through `aria-sort`.
 */
export function DataTable<T>({
  caption,
  columns,
  data,
  getRowKey,
  className,
  captionClassName,
  defaultSortKey,
  defaultSortDirection = "ascending",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSortDirection
  );

  const sortedData = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey);
    if (!column || !column.sortable) return data;

    const { sortAccessor } = column;
    const withIndex = data.map((row, index) => ({ row, index }));
    withIndex.sort((a, b) => {
      const cmp = compareValues(sortAccessor(a.row), sortAccessor(b.row));
      if (cmp !== 0) return sortDirection === "ascending" ? cmp : -cmp;
      return a.index - b.index;
    });
    return withIndex.map((entry) => entry.row);
  }, [data, columns, sortKey, sortDirection]);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    if (sortKey === column.key) {
      setSortDirection((prev) =>
        prev === "ascending" ? "descending" : "ascending"
      );
    } else {
      setSortKey(column.key);
      setSortDirection("ascending");
    }
  };

  return (
    <div className={`overflow-x-auto ${className ?? ""}`}>
      <table className="w-full border-collapse text-left text-sm">
        <caption
          className={`caption-top mb-2 text-left text-xs text-zinc-500 dark:text-zinc-400 ${
            captionClassName ?? ""
          }`}
        >
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            {columns.map((column) => {
              const isActive = sortKey === column.key;
              const alignClass = ALIGN_CLASSES[column.align ?? "left"];

              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    column.sortable
                      ? isActive
                        ? sortDirection
                        : "none"
                      : undefined
                  }
                  className={`px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400 ${alignClass} ${
                    column.headerClassName ?? ""
                  }`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      {column.header}
                      <SortIndicator active={isActive} direction={sortDirection} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-900"
            >
              {columns.map((column) => {
                const alignClass = ALIGN_CLASSES[column.align ?? "left"];
                const cellClassName = `px-3 py-2 ${alignClass} ${
                  column.cellClassName ?? ""
                }`;
                const content = column.render(row, index);

                return column.rowHeader ? (
                  <th
                    key={column.key}
                    scope="row"
                    className={`font-medium ${cellClassName}`}
                  >
                    {content}
                  </th>
                ) : (
                  <td key={column.key} className={cellClassName}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
