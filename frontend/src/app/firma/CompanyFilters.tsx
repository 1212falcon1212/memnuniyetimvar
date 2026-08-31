"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CompanyFiltersProps {
  categories: Category[];
  currentCity: string;
  currentCategoryId: string;
  currentSort: string;
  currentSearch: string;
}

const CITIES = [
  { value: "", label: "Tüm Şehirler" },
  { value: "İstanbul", label: "İstanbul" },
  { value: "Ankara", label: "Ankara" },
  { value: "İzmir", label: "İzmir" },
  { value: "Bursa", label: "Bursa" },
  { value: "Antalya", label: "Antalya" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "En Yüksek Puan" },
  { value: "reviews", label: "En Çok Yorum" },
  { value: "name", label: "İsim (A-Z)" },
  { value: "created_at", label: "En Yeni" },
];

export function CompanyFilters({
  categories,
  currentCity,
  currentCategoryId,
  currentSort,
  currentSearch,
}: CompanyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const navigate = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value) {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      if (key !== "page") sp.delete("page");
      const qs = sp.toString();
      router.push(qs ? `/firma?${qs}` : "/firma");
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (searchInput === currentSearch) return;
    const timer = setTimeout(() => {
      navigate("search", searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, navigate]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Firma adıyla ara..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          value={currentCity}
          onChange={(e) => navigate("city", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {CITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={currentCategoryId}
          onChange={(e) => navigate("categoryId", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={(e) => navigate("sortBy", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
