"use client";

import { useState } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = items.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  return {
    page: safePage,
    totalPages,
    pageItems,
    totalItems: items.length,
    pageSize,
    setPage: goToPage,
  };
}
