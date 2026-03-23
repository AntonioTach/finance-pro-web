import { Injectable, signal, effect } from '@angular/core';

export type ThemeId = 'dark' | 'light' | 'sand' | 'midnight' | 'ocean' | 'aurora' | 'pink-light' | 'violet' | 'ice' | 'graphite';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [

  {
    id: 'light',
    name: 'Light',
    description: 'Claro con acentos índigo modernos',
    preview: { bg: '#f8fafc', card: '#ffffff', accent: '#6366f1', text: '#0f172a' },
    vars: {
      '--bg-color': '#f0f4f8',
      '--bg-secondary': '#e8edf5',
      '--bg-elevated': '#ffffff',
      '--bg-input': '#ffffff',
      '--bg-hover': 'rgba(0, 0, 0, 0.04)',
      '--text-color': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--border-color': 'rgba(0, 0, 0, 0.09)',
      '--border-hover': 'rgba(0, 0, 0, 0.15)',
      '--primary-color': '#6366f1',
      '--primary-hover': '#5457e8',
      '--primary-light': '#4f46e5',
      '--primary-subtle': 'rgba(99, 102, 241, 0.1)',
      '--primary-glow': 'rgba(99, 102, 241, 0.2)',
      '--secondary-color': '#8b5cf6',
      '--gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 60%, #f0f4ff 100%)',
      '--glass-bg': 'rgba(0, 0, 0, 0.02)',
      '--glass-bg-stronger': 'rgba(0, 0, 0, 0.04)',
      '--glass-border': 'rgba(0, 0, 0, 0.08)',
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
      '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
  },
  {
    id: 'sand',
    name: 'Sand',
    description: 'Warm ivory with golden amber accent',
    preview: { bg: '#faf8f4', card: '#ffffff', accent: '#d97706', text: '#1c1917' },
    vars: {
      '--bg-color': '#faf8f4',
      '--bg-secondary': '#f0ece2',
      '--bg-elevated': '#ffffff',
      '--bg-input': '#ffffff',
      '--bg-hover': 'rgba(0, 0, 0, 0.04)',
      '--text-color': '#1c1917',
      '--text-secondary': '#78716c',
      '--text-muted': '#a8a29e',
      '--border-color': 'rgba(0, 0, 0, 0.08)',
      '--border-hover': 'rgba(0, 0, 0, 0.14)',
      '--primary-color': '#d97706',
      '--primary-hover': '#b45309',
      '--primary-light': '#b45309',
      '--primary-subtle': 'rgba(217, 119, 6, 0.1)',
      '--primary-glow': 'rgba(217, 119, 6, 0.2)',
      '--secondary-color': '#f59e0b',
      '--gradient-primary': 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fef9ee 100%)',
      '--glass-bg': 'rgba(0, 0, 0, 0.02)',
      '--glass-bg-stronger': 'rgba(0, 0, 0, 0.04)',
      '--glass-border': 'rgba(0, 0, 0, 0.07)',
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.06)',
      '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
      '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'pink-light',
    name: 'Pink Light',
    description: 'Suave y moderno con acentos rosados elegantes',
    preview: { bg: '#fff1f5', card: '#ffffff', accent: '#ec4899', text: '#1e293b' },
    vars: {
      '--bg-color': '#fff1f5',
      '--bg-secondary': '#ffe4ec',
      '--bg-elevated': '#ffffff',
      '--bg-input': '#ffffff',
      '--bg-hover': 'rgba(236, 72, 153, 0.06)',

      '--text-color': '#1e293b',
      '--text-secondary': '#64748b',
      '--text-muted': '#94a3b8',

      '--border-color': 'rgba(236, 72, 153, 0.15)',
      '--border-hover': 'rgba(236, 72, 153, 0.3)',

      '--primary-color': '#ec4899',
      '--primary-hover': '#db2777',
      '--primary-light': '#f472b6',
      '--primary-subtle': 'rgba(236, 72, 153, 0.12)',
      '--primary-glow': 'rgba(236, 72, 153, 0.25)',

      '--secondary-color': '#f9a8d4',

      '--gradient-primary': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #fff1f5 0%, #ffe4ec 60%, #fff1f5 100%)',

      '--glass-bg': 'rgba(255, 255, 255, 0.6)',
      '--glass-bg-stronger': 'rgba(255, 255, 255, 0.85)',
      '--glass-border': 'rgba(236, 72, 153, 0.2)',

      '--shadow-sm': '0 1px 3px rgba(236, 72, 153, 0.08)',
      '--shadow-md': '0 4px 16px rgba(236, 72, 153, 0.12)',
      '--shadow-lg': '0 8px 32px rgba(236, 72, 153, 0.16)',
    },
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Minimalista frío con azul suave',
    preview: { bg: '#f5f9ff', card: '#ffffff', accent: '#3b82f6', text: '#0f172a' },
    vars: {
      '--bg-color': '#f5f9ff',
      '--bg-secondary': '#eaf2ff',
      '--bg-elevated': '#ffffff',
      '--bg-input': '#ffffff',
      '--bg-hover': 'rgba(59, 130, 246, 0.05)',

      '--text-color': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',

      '--border-color': 'rgba(59, 130, 246, 0.12)',
      '--border-hover': 'rgba(59, 130, 246, 0.25)',

      '--primary-color': '#3b82f6',
      '--primary-hover': '#2563eb',
      '--primary-light': '#60a5fa',
      '--primary-subtle': 'rgba(59, 130, 246, 0.1)',
      '--primary-glow': 'rgba(59, 130, 246, 0.2)',

      '--secondary-color': '#38bdf8',

      '--gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #38bdf8 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #f5f9ff 0%, #e0edff 60%, #f5f9ff 100%)',

      '--glass-bg': 'rgba(255, 255, 255, 0.7)',
      '--glass-bg-stronger': 'rgba(255, 255, 255, 0.9)',
      '--glass-border': 'rgba(59, 130, 246, 0.15)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Oscuro profundo con acentos índigo',
    preview: { bg: '#080c14', card: '#111827', accent: '#6366f1', text: '#f1f5f9' },
    vars: {
      '--bg-color': '#080c14',
      '--bg-secondary': '#0d1219',
      '--bg-elevated': '#111827',
      '--bg-input': 'rgba(15, 20, 30, 0.8)',
      '--bg-hover': 'rgba(255, 255, 255, 0.05)',
      '--text-color': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#475569',
      '--border-color': 'rgba(255, 255, 255, 0.08)',
      '--border-hover': 'rgba(255, 255, 255, 0.15)',
      '--primary-color': '#6366f1',
      '--primary-hover': '#5457e8',
      '--primary-light': '#818cf8',
      '--primary-subtle': 'rgba(99, 102, 241, 0.12)',
      '--primary-glow': 'rgba(99, 102, 241, 0.25)',
      '--secondary-color': '#8b5cf6',
      '--gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.03)',
      '--glass-bg-stronger': 'rgba(255, 255, 255, 0.06)',
      '--glass-border': 'rgba(255, 255, 255, 0.08)',
    },
  },
   {
    id: 'graphite',
    name: 'Graphite',
    description: 'Oscuro neutro elegante tipo macOS',
    preview: { bg: '#0f0f10', card: '#18181b', accent: '#a1a1aa', text: '#fafafa' },
    vars: {
      '--bg-color': '#0f0f10',
      '--bg-secondary': '#141416',
      '--bg-elevated': '#18181b',
      '--bg-input': 'rgba(24, 24, 27, 0.9)',
      '--bg-hover': 'rgba(255, 255, 255, 0.04)',

      '--text-color': '#fafafa',
      '--text-secondary': '#a1a1aa',
      '--text-muted': '#52525b',

      '--border-color': 'rgba(255, 255, 255, 0.08)',
      '--border-hover': 'rgba(255, 255, 255, 0.15)',

      '--primary-color': '#71717a',
      '--primary-hover': '#52525b',
      '--primary-light': '#a1a1aa',
      '--primary-subtle': 'rgba(161, 161, 170, 0.1)',
      '--primary-glow': 'rgba(161, 161, 170, 0.2)',

      '--secondary-color': '#3f3f46',

      '--gradient-primary': 'linear-gradient(135deg, #3f3f46 0%, #71717a 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #0f0f10 0%, #1c1c1f 60%, #0f0f10 100%)',

      '--glass-bg': 'rgba(255, 255, 255, 0.02)',
      '--glass-bg-stronger': 'rgba(255, 255, 255, 0.05)',
      '--glass-border': 'rgba(255, 255, 255, 0.06)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Negro puro con violeta eléctrico',
    preview: { bg: '#000000', card: '#0d0d0d', accent: '#a855f7', text: '#fafafa' },
    vars: {
      '--bg-color': '#000000',
      '--bg-secondary': '#080808',
      '--bg-elevated': '#0d0d0d',
      '--bg-input': 'rgba(10, 10, 10, 0.9)',
      '--bg-hover': 'rgba(255, 255, 255, 0.05)',
      '--text-color': '#fafafa',
      '--text-secondary': '#a1a1aa',
      '--text-muted': '#52525b',
      '--border-color': 'rgba(255, 255, 255, 0.06)',
      '--border-hover': 'rgba(255, 255, 255, 0.12)',
      '--primary-color': '#a855f7',
      '--primary-hover': '#9333ea',
      '--primary-light': '#c084fc',
      '--primary-subtle': 'rgba(168, 85, 247, 0.12)',
      '--primary-glow': 'rgba(168, 85, 247, 0.25)',
      '--secondary-color': '#ec4899',
      '--gradient-primary': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #000000 0%, #1a0030 60%, #000000 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.02)',
      '--glass-bg-stronger': 'rgba(255, 255, 255, 0.05)',
      '--glass-border': 'rgba(255, 255, 255, 0.06)',
    },
  },
  // {
  //   id: 'aurora',
  //   name: 'Aurora',
  //   description: 'Anochecer boreal con verde esmeralda',
  //   preview: { bg: '#071210', card: '#0d1f1c', accent: '#10b981', text: '#ecfdf5' },
  //   vars: {
  //     '--bg-color': '#071210',
  //     '--bg-secondary': '#0a1814',
  //     '--bg-elevated': '#0d1f1c',
  //     '--bg-input': 'rgba(8, 20, 16, 0.9)',
  //     '--bg-hover': 'rgba(16, 185, 129, 0.06)',
  //     '--text-color': '#ecfdf5',
  //     '--text-secondary': '#6ee7b7',
  //     '--text-muted': '#2d6e56',
  //     '--border-color': 'rgba(16, 185, 129, 0.1)',
  //     '--border-hover': 'rgba(16, 185, 129, 0.2)',
  //     '--primary-color': '#10b981',
  //     '--primary-hover': '#059669',
  //     '--primary-light': '#34d399',
  //     '--primary-subtle': 'rgba(16, 185, 129, 0.12)',
  //     '--primary-glow': 'rgba(16, 185, 129, 0.25)',
  //     '--secondary-color': '#14b8a6',
  //     '--gradient-primary': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  //     '--gradient-hero': 'linear-gradient(135deg, #071210 0%, #0a2a20 60%, #071210 100%)',
  //     '--glass-bg': 'rgba(16, 185, 129, 0.03)',
  //     '--glass-bg-stronger': 'rgba(16, 185, 129, 0.06)',
  //     '--glass-border': 'rgba(16, 185, 129, 0.08)',
  //   },
  // },
  // {
  //   id: 'violet',
  //   name: 'Violet',
  //   description: 'Oscuro moderno con púrpura vibrante',
  //   preview: { bg: '#0b0613', card: '#140a1f', accent: '#a855f7', text: '#f5f3ff' },
  //   vars: {
  //     '--bg-color': '#0b0613',
  //     '--bg-secondary': '#11091b',
  //     '--bg-elevated': '#140a1f',
  //     '--bg-input': 'rgba(20, 10, 31, 0.9)',
  //     '--bg-hover': 'rgba(168, 85, 247, 0.08)',

  //     '--text-color': '#f5f3ff',
  //     '--text-secondary': '#c4b5fd',
  //     '--text-muted': '#6d28d9',

  //     '--border-color': 'rgba(168, 85, 247, 0.15)',
  //     '--border-hover': 'rgba(168, 85, 247, 0.3)',

  //     '--primary-color': '#a855f7',
  //     '--primary-hover': '#9333ea',
  //     '--primary-light': '#c084fc',
  //     '--primary-subtle': 'rgba(168, 85, 247, 0.15)',
  //     '--primary-glow': 'rgba(168, 85, 247, 0.35)',

  //     '--secondary-color': '#7c3aed',

  //     '--gradient-primary': 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
  //     '--gradient-hero': 'linear-gradient(135deg, #0b0613 0%, #1e0a3c 60%, #0b0613 100%)',

  //     '--glass-bg': 'rgba(168, 85, 247, 0.05)',
  //     '--glass-bg-stronger': 'rgba(168, 85, 247, 0.08)',
  //     '--glass-border': 'rgba(168, 85, 247, 0.12)',
  //   },
  // },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Profundidades del mar con cyan glaciar',
    preview: { bg: '#060d1a', card: '#0c1929', accent: '#06b6d4', text: '#e2f8ff' },
    vars: {
      '--bg-color': '#060d1a',
      '--bg-secondary': '#090f20',
      '--bg-elevated': '#0c1929',
      '--bg-input': 'rgba(8, 15, 28, 0.9)',
      '--bg-hover': 'rgba(6, 182, 212, 0.06)',
      '--text-color': '#e2f8ff',
      '--text-secondary': '#7dd3e8',
      '--text-muted': '#3d7a8a',
      '--border-color': 'rgba(6, 182, 212, 0.1)',
      '--border-hover': 'rgba(6, 182, 212, 0.2)',
      '--primary-color': '#06b6d4',
      '--primary-hover': '#0891b2',
      '--primary-light': '#67e8f9',
      '--primary-subtle': 'rgba(6, 182, 212, 0.12)',
      '--primary-glow': 'rgba(6, 182, 212, 0.25)',
      '--secondary-color': '#0ea5e9',
      '--gradient-primary': 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
      '--gradient-hero': 'linear-gradient(135deg, #060d1a 0%, #0c2a3a 60%, #060d1a 100%)',
      '--glass-bg': 'rgba(6, 182, 212, 0.03)',
      '--glass-bg-stronger': 'rgba(6, 182, 212, 0.06)',
      '--glass-border': 'rgba(6, 182, 212, 0.08)',
    },
  },
];

const STORAGE_KEY = 'fp_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _currentTheme = signal<ThemeId>('dark');
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly themes = THEMES;

  constructor() {
    // Restore saved theme
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.find(t => t.id === saved)) {
      this.applyTheme(saved);
    } else {
      this.applyTheme('dark');
    }
  }

  setTheme(id: ThemeId): void {
    this.applyTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  private applyTheme(id: ThemeId): void {
    const theme = THEMES.find(t => t.id === id);
    if (!theme) return;

    const root = document.documentElement;

    // Apply CSS variables
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }

    // Toggle dark-mode class for PrimeNG
    if (id === 'light' || id === 'sand') {
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
    }

    // Update PrimeNG surface variables
    this.updatePrimengSurfaces(theme);

    this._currentTheme.set(id);
  }

  private updatePrimengSurfaces(theme: Theme): void {
    const root = document.documentElement;
    const vars = theme.vars;

    root.style.setProperty('--surface-ground', vars['--bg-color'] ?? '');
    root.style.setProperty('--surface-card', vars['--bg-elevated'] ?? '');
    root.style.setProperty('--surface-section', vars['--bg-elevated'] ?? '');
    root.style.setProperty('--surface-header', vars['--bg-secondary'] ?? '');
    root.style.setProperty('--surface-border', vars['--border-color'] ?? '');
    root.style.setProperty('--surface-hover', vars['--bg-hover'] ?? '');
    root.style.setProperty('--text-color', vars['--text-color'] ?? '');
    root.style.setProperty('--text-color-secondary', vars['--text-secondary'] ?? '');
    root.style.setProperty('--primary-color', vars['--primary-color'] ?? '');
  }

  getCurrentThemeData(): Theme {
    return THEMES.find(t => t.id === this._currentTheme()) ?? THEMES[0];
  }
}
