"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

interface HelpfulButtonProps {
  reviewId: string;
  initialCount: number;
  isHelpful: boolean;
}

export function HelpfulButton({
  reviewId,
  initialCount,
  isHelpful,
}: HelpfulButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const [helpful, setHelpful] = useState(isHelpful);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

    const previousHelpful = helpful;
    const previousCount = count;

    setHelpful(!helpful);
    setCount((prev) => (helpful ? prev - 1 : prev + 1));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const response = await fetch(
        `${API_BASE}/reviews/${reviewId}/helpful`,
        {
          method: helpful ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        setHelpful(previousHelpful);
        setCount(previousCount);
      }
    } catch {
      setHelpful(previousHelpful);
      setCount(previousCount);
    }
  }, [helpful, count, isAuthenticated, reviewId]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
          helpful
            ? "border-primary bg-primary/10 text-primary"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
        }`}
      >
        <span
          className={`transition-transform ${animating ? "scale-125" : "scale-100"}`}
        >
          {helpful ? "👍" : "👍"}
        </span>
        <span>Faydali</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs transition-all ${
            helpful ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-500"
          } ${animating ? "scale-110" : "scale-100"}`}
        >
          {count}
        </span>
      </button>

      {showLoginPrompt && (
        <div className="absolute left-0 top-full z-10 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm text-gray-700">
            Bu islemi yapmak icin{" "}
            <a href="/giris" className="font-semibold text-primary hover:underline">
              giris yapin
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
