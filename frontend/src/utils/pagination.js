export const DEFAULT_PAGE_SIZE = 9;
export const REVIEW_PAGE_SIZE = 3;
export const EXAM_PAGE_SIZE = 10;
export const EXAM_PAGE_SIZE_OPTIONS = [10, 20, 30];

export function paginateItems(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    pageItems: items.slice(start, start + pageSize),
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}
