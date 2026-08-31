"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
