import { create } from "zustand";

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchFocused: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchFocused: (focused: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchFocused: false,
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  setSearchFocused: (isSearchFocused) => set({ isSearchFocused }),
}));
