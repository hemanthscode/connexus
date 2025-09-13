// tailwind.config.js
export const content = ['./src/**/*.{js,jsx}'];
export const theme = {
  extend: {
    colors: {
      primary: '#0EA5A4',
      accent: '#6366F1',
      surfaceLight: '#F8FAFC',
      surfaceDark: '#111827',
      textPrimary: '#0F172A',
      mutedText: '#64748B',
      success: '#16A34A',
      error: '#EF4444'
    },
    backgroundColor: {
      primary: '#0EA5A4',
      accent: '#6366F1',
      surface: '#F8FAFC',
      surfaceDark: '#111827',
    },
    textColor: {
      primary: '#0F172A',
      muted: '#64748B',
    },
  }
};
export const darkMode = 'class';
