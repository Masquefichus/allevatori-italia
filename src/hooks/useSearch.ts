"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface SearchFilters {
  q?: string;
  region?: string;
  province?: string;
  breed?: string;
  enci?: string;
  premium?: string;
  sort?: string;
  page?: string;
}

export function useSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const filters = useMemo<SearchFilters>(() => ({
    q: searchParams.get("q") || undefined,
    region: searchParams.get("region") || undefined,
    province: searchParams.get("province") || undefined,
    breed: searchParams.get("breed") || undefined,
    enci: searchParams.get("enci") || undefined,
    premium: searchParams.get("premium") || undefined,
    sort: searchParams.get("sort") || undefined,
    page: searchParams.get("page") || undefined,
  }), [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change (except page itself)
      if (!("page" in newFilters)) {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`);
      setLoading(false);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v !== undefined),
    [filters]
  );

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    loading,
  };
}
