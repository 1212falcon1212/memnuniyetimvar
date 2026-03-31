"use client";

import { useState, type FormEvent } from "react";
import { StarRating } from "@/components/review/StarRating";

interface ReviewFormData {
  companySearch: string;
  title: string;
  content: string;
  rating: number;
  tags: string;
  images: File[];
}

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface ValidationErrors {
  companySearch?: string;
  title?: string;
  content?: string;
  rating?: string;
}

export function ReviewForm({ onSubmit, loading, error }: ReviewFormProps) {
  const [companySearch, setCompanySearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  function validate(): boolean {
    const errors: ValidationErrors = {};

    if (!companySearch.trim()) {
      errors.companySearch = "Firma secimi zorunludur.";
    }

    if (title.trim().length < 5) {
      errors.title = "Baslik en az 5 karakter olmalidir.";
    } else if (title.trim().length > 200) {
      errors.title = "Baslik en fazla 200 karakter olmalidir.";
    }

    if (content.trim().length < 20) {
      errors.content = "Yorum en az 20 karakter olmalidir.";
    } else if (content.trim().length > 5000) {
      errors.content = "Yorum en fazla 5000 karakter olmalidir.";
    }

    if (rating === 0) {
      errors.rating = "Puan secimi zorunludur.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      companySearch: companySearch.trim(),
      title: title.trim(),
      content: content.trim(),
      rating,
      tags: tags.trim(),
      images,
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const total = images.length + newFiles.length;

    if (total > 5) {
      setValidationErrors((prev) => ({
        ...prev,
      }));
      return;
    }

    setImages((prev) => [...prev, ...newFiles].slice(0, 5));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Company Search */}
      <div>
        <label
          htmlFor="companySearch"
          className="block text-sm font-semibold text-gray-700"
        >
          Firma <span className="text-red-500">*</span>
        </label>
        <input
          id="companySearch"
          type="text"
          placeholder="Firma adini yazin..."
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
        />
        {validationErrors.companySearch && (
          <p className="mt-1.5 text-sm text-red-600">
            {validationErrors.companySearch}
          </p>
        )}
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          Puaniniz <span className="text-red-500">*</span>
        </label>
        <div className="mt-1.5">
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
        {rating > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {rating === 1 && "Cok Kotu"}
            {rating === 2 && "Kotu"}
            {rating === 3 && "Orta"}
            {rating === 4 && "Iyi"}
            {rating === 5 && "Mukemmel"}
          </p>
        )}
        {validationErrors.rating && (
          <p className="mt-1.5 text-sm text-red-600">
            {validationErrors.rating}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-semibold text-gray-700"
        >
          Baslik <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="Deneyiminizi ozetleyin..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>En az 5 karakter</span>
          <span>{title.length}/200</span>
        </div>
        {validationErrors.title && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.title}
          </p>
        )}
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-semibold text-gray-700"
        >
          Yorumunuz <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          placeholder="Deneyiminizi detayli bir sekilde anlatin..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={6}
          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors resize-y"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>En az 20 karakter</span>
          <span>{content.length}/5000</span>
        </div>
        {validationErrors.content && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.content}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-semibold text-gray-700"
        >
          Etiketler{" "}
          <span className="font-normal text-gray-400">(istege bagli)</span>
        </label>
        <input
          id="tags"
          type="text"
          placeholder="ornek: musteri-hizmetleri, hizli-teslimat"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
        />
        <p className="mt-1 text-xs text-gray-400">
          Virgul ile ayirarak birden fazla etiket ekleyebilirsiniz.
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          Gorseller{" "}
          <span className="font-normal text-gray-400">
            (istege bagli, en fazla 5)
          </span>
        </label>
        <div className="mt-1.5">
          {/* Preview thumbnails */}
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Yuklenen gorsel ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-lg font-bold">X</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 16v-8m-4 4h8m6 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2m4-6l4-4 4 4m-4-4v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Gorsel yuklemek icin tiklayin
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PNG, JPG — Maks. 5 gorsel
                </p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Gonderiliyor..." : "Yorumu Gonder"}
      </button>
    </form>
  );
}
