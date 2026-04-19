"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/users/me")
      .then((res) => {
        const user = res.data?.data || res.data;
        setUser(user);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [setUser, setLoading]);

  return <>{children}</>;
}
