"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ReviewListControlsProps {
  currentSort: string;
  currentRating: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "helpful", label: "En Faydalı" },
  { value: "highest", label: "En Yüksek Puan" },
  { value: "lowest", label: "En Düşük Puan" },
];

const RATING_OPTIONS = [
  { value: "", label: "Tüm Puanlar" },
  { value: "5", label: "5 Yıldız" },
  { value: "4", label: "4 Yıldız" },
  { value: "3", label: "3 Yıldız" },
  { value: "2", label: "2 Yıldız" },
  { value: "1", label: "1 Yıldız" },
];

export function ReviewListControls({ currentSort, currentRating }: ReviewListControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value) {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      sp.delete("page");
      const qs = sp.toString();
      const slug = window.location.pathname.split("/").pop();
      router.push(qs ? `/firma/${slug}?${qs}` : `/firma/${slug}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        value={currentSort}
        onChange={(e) => navigate("sortBy", e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <select
        value={currentRating}
        onChange={(e) => navigate("rating", e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        {RATING_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  );
}
