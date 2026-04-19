import { create } from "zustand";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  role: string;
  reviewCount: number;
  helpfulCount: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initAuth: async () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const u = json.data || json;
        set({
          user: {
            id: u.id,
            fullName: u.full_name || u.fullName,
            email: u.email,
            phone: u.phone,
            avatarUrl: u.avatar_url || u.avatarUrl,
            isPhoneVerified: u.is_phone_verified ?? u.isPhoneVerified,
            isEmailVerified: u.is_email_verified ?? u.isEmailVerified,
            role: u.role,
            reviewCount: u.review_count ?? u.reviewCount ?? 0,
            helpfulCount: u.helpful_count ?? u.helpfulCount ?? 0,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
