"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface SuggestResult {
  companies: { id: string; name: string; slug: string; avgRating: number; reviewCount: number }[];
  categories: { id: number; name: string; slug: string }[];
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions(null);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/search/suggest", { params: { q: q.trim(), limit: 5 } });
      const data = res.data.data || res.data;
      const result: SuggestResult = {
        companies: Array.isArray(data.companies) ? data.companies : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
      };
      setSuggestions(result);
      setShowDropdown(result.companies.length > 0 || result.categories.length > 0);
    } catch {
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/arama?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasResults = suggestions && (suggestions.companies.length > 0 || suggestions.categories.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (hasResults) setShowDropdown(true); }}
          placeholder="Firma ara veya memnuniyetini paylaş..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm placeholder:text-gray-400 focus:border-[#166534] focus:outline-none focus:ring-1 focus:ring-[#166534]"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#166534]"
        >
          {loading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          )}
        </button>
      </form>

      {showDropdown && hasResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions!.companies.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">
                Firmalar
              </div>
              {suggestions!.companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/firma/${company.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold flex-shrink-0">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{company.name}</div>
                    <div className="text-xs text-gray-400">
                      {company.reviewCount > 0 ? `${company.reviewCount} yorum` : "Henüz yorum yok"}
                      {company.avgRating > 0 && ` · ${company.avgRating.toFixed(1)} ★`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {suggestions!.categories.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-t border-gray-100">
                Kategoriler
              </div>
              {suggestions!.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/kategori/${cat.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}

          <Link
            href={`/arama?q=${encodeURIComponent(query.trim())}`}
            className="flex items-center justify-center gap-1 border-t border-gray-100 px-3 py-2.5 text-sm font-medium text-[#166534] transition-colors hover:bg-gray-50"
            onClick={() => setShowDropdown(false)}
          >
            Tüm sonuçları gör
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
