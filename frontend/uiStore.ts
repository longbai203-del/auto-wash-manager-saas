import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  language: 'en' | 'zh'
  setLanguage: (lang: 'en' | 'zh') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}))
