"use client";

import { useState, useEffect, type FormEvent } from "react";
import { StarRating } from "@/components/review/StarRating";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface ReviewFormData {
  companyId: string;
  title: string;
  content: string;
  rating: number;
  tagIds: number[];
  images: File[];
}

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
}

interface TagOption {
  id: number;
  name: string;
}

export function ReviewForm({ onSubmit, loading, error }: ReviewFormProps) {
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);

  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Firma arama
  useEffect(() => {
    if (companyQuery.length < 2 || selectedCompany) {
      setCompanyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/companies/search?query=${encodeURIComponent(companyQuery)}&limit=5`);
        const json = await res.json();
        setCompanyResults(json.data || []);
        setShowDropdown(true);
      } catch { setCompanyResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [companyQuery, selectedCompany]);

  // Etiketleri yükle
  useEffect(() => {
    fetch(`${API}/tags`)
      .then((r) => r.json())
      .then((json) => setAvailableTags(json.data || []))
      .catch(() => {});
  }, []);

  function selectCompany(c: CompanyOption) {
    setSelectedCompany(c);
    setCompanyQuery(c.name);
    setShowDropdown(false);
  }

  function clearCompany() {
    setSelectedCompany(null);
    setCompanyQuery("");
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!selectedCompany) e.company = "Firma secimi zorunludur.";
    if (title.trim().length < 5) e.title = "Baslik en az 5 karakter olmalidir.";
    if (content.trim().length < 20) e.content = "Yorum en az 20 karakter olmalidir.";
    if (rating === 0) e.rating = "Puan secimi zorunludur.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    await onSubmit({
      companyId: selectedCompany!.id,
      title: title.trim(),
      content: content.trim(),
      rating,
      tagIds: selectedTagIds,
      images,
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)].slice(0, 5));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Firma Arama */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700">
          Firma <span className="text-red-500">*</span>
        </label>
        {selectedCompany ? (
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-primary bg-primary-light px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              {selectedCompany.name.charAt(0)}
            </span>
            <span className="text-sm font-medium text-foreground">{selectedCompany.name}</span>
            <button type="button" onClick={clearCompany} className="ml-auto text-muted hover:text-red-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Firma adini yazin..."
              value={companyQuery}
              onChange={(e) => { setCompanyQuery(e.target.value); setSelectedCompany(null); }}
              onFocus={() => companyResults.length > 0 && setShowDropdown(true)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            {showDropdown && companyResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                {companyResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCompany(c)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-sm font-bold text-primary">
                      {c.name.charAt(0)}
                    </span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {errors.company && <p className="mt-1.5 text-sm text-red-600">{errors.company}</p>}
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">Puaniniz <span className="text-red-500">*</span></label>
        <div className="mt-1.5"><StarRating value={rating} onChange={setRating} size="lg" /></div>
        {rating > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {["", "Cok Kotu", "Kotu", "Orta", "Iyi", "Mukemmel"][rating]}
          </p>
        )}
        {errors.rating && <p className="mt-1.5 text-sm text-red-600">{errors.rating}</p>}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700">Baslik <span className="text-red-500">*</span></label>
        <input
          id="title" type="text" placeholder="Deneyiminizi ozetleyin..."
          value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400"><span>En az 5 karakter</span><span>{title.length}/200</span></div>
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-semibold text-gray-700">Yorumunuz <span className="text-red-500">*</span></label>
        <textarea
          id="content" placeholder="Deneyiminizi detayli anlatin..." rows={6}
          value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000}
          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400"><span>En az 20 karakter</span><span>{content.length}/5000</span></div>
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700">Etiketler <span className="font-normal text-gray-400">(en fazla 5)</span></label>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">Gorseller <span className="font-normal text-gray-400">(en fazla 5)</span></label>
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((file, i) => (
              <div key={`${file.name}-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold">X</span>
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length < 5 && (
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-primary transition-colors">
            <div className="text-center">
              <p className="text-sm text-gray-500">Gorsel yuklemek icin tiklayin</p>
              <p className="mt-1 text-xs text-gray-400">PNG, JPG — Maks. 5</p>
            </div>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
        {loading ? "Gonderiliyor..." : "Yorumu Gonder"}
      </button>
    </form>
  );
}
