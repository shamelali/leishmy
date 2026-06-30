import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NumberedPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  centered?: boolean;
}

export function NumberedPagination({
  pagination,
  onPageChange,
  centered,
}: NumberedPaginationProps) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div
      className={`flex items-center ${centered ? "justify-center gap-4" : "justify-between"} pt-4 pb-2`}
    >
      {!centered && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[2.25rem] h-9 text-sm font-medium rounded-xl transition-all ${
                p === page
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30"
                  : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface LoadMoreProps {
  pagination: PaginationInfo;
  onLoadMore: () => void;
  loading?: boolean;
}

export function LoadMore({ pagination, onLoadMore, loading }: LoadMoreProps) {
  if (pagination.page >= pagination.totalPages) return null;

  return (
    <div className="flex justify-center py-8">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-neutral-900 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {loading
          ? "Loading..."
          : `Explore More (${pagination.total - pagination.page * pagination.limit} left)`}
      </button>
    </div>
  );
}

interface PageSizeSelectorProps {
  pageSize: number;
  onChange: (size: number) => void;
  options?: number[];
}

export function PageSizeSelector({
  pageSize,
  onChange,
  options,
}: PageSizeSelectorProps) {
  const sizes = options || [10, 25, 50, 100];
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500 dark:text-gray-400">
        Per page:
      </label>
      <select
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
      >
        {sizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

export type { PaginationInfo };
