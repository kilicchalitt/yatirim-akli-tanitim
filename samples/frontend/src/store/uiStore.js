import { create } from 'zustand';

let toastIdCounter = 0;

const THEME_KEY = 'yz_theme';
const THEME_COLORS = { light: '#f5f9ff', dark: '#0e1522' };

// Tercih: 'system' (kayıt yok, işletim sistemi), 'light' veya 'dark' (localStorage'da kullanıcı seçimi).
const readPreference = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
};

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolveTheme = (preference) => (preference === 'system' ? systemTheme() : preference);

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
};

const initialPreference = readPreference();
const initialTheme = resolveTheme(initialPreference);
applyTheme(initialTheme);

export const useUiStore = create((set, get) => ({
  sidebarOpen: window.innerWidth > 768,
  toasts: [],
  searchQuery: '',
  theme: initialTheme,
  themePreference: initialPreference,

  // `preference`: 'system' | 'light' | 'dark'. 'system' kaydı siler ve işletim sistemini izler.
  setTheme: (preference) => {
    try {
      if (preference === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Depolama kapalıysa tercih yalnızca bu oturumda geçerli.
    }
    const theme = resolveTheme(preference);
    applyTheme(theme);
    set({ theme, themePreference: preference });
  },

  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  // İşletim sistemi teması değişince (yalnızca tercih 'system' iken) uygulanır.
  syncSystemTheme: () => {
    if (get().themePreference !== 'system') return;
    const theme = systemTheme();
    applyTheme(theme);
    set({ theme });
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setSearchQuery: (query) =>
    set({ searchQuery: query }),

  addToast: (toast) => {
    const id = ++toastIdCounter;
    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () =>
    set({ toasts: [] }),
}));

export default useUiStore;

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    useUiStore.getState().syncSystemTheme();
  });
}
