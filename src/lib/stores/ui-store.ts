import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Global UI/layout state (not domain data). Currently just the navigation
 * sidebar collapse preference, persisted to localStorage so the user's choice
 * survives reloads and navigation.
 */
interface UiState {
  /** True = collapsed icon rail (~72px); false = expanded (~250px). */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

/** SSR-safe no-op storage for the server render pass. */
const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: "ui-preferences",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
    },
  ),
);
