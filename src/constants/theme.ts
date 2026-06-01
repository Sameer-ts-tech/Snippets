export const theme = {
  dark: {
    background: '#0B0F19',       // Deep obsidian navy
    card: '#161C2C',             // Glass card base navy
    cardTransparent: 'rgba(22, 28, 44, 0.75)',
    border: '#242F47',           // Slate border
    text: '#F8FAFC',             // Pure white/slate
    textMuted: '#94A3B8',        // Cool gray
    primary: '#6366F1',          // Electric Indigo
    primaryLight: 'rgba(99, 102, 241, 0.15)',
    primaryGradient: ['#6366F1', '#8B5CF6'], // Indigo to Violet
    secondary: '#10B981',        // Emerald green
    secondaryLight: 'rgba(16, 185, 129, 0.15)',
    accent: '#F59E0B',           // Amber Gold for favorites
    danger: '#EF4444',           // Coral red
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    glow: 'rgba(99, 102, 241, 0.3)',
  },
  light: {
    background: '#F8FAFC',       // Crisp light slate
    card: '#FFFFFF',             // Clean white
    cardTransparent: 'rgba(255, 255, 255, 0.85)',
    border: '#E2E8F0',           // Light border
    text: '#0F172A',             // Dark navy
    textMuted: '#64748B',        // Muted gray
    primary: '#4F46E5',          // Rich Indigo
    primaryLight: 'rgba(79, 70, 229, 0.1)',
    primaryGradient: ['#4F46E5', '#7C3AED'],
    secondary: '#059669',        // Deep emerald
    secondaryLight: 'rgba(5, 150, 105, 0.1)',
    accent: '#D97706',           // Gold
    danger: '#DC2626',           // Crimson
    dangerLight: 'rgba(220, 38, 38, 0.1)',
    glow: 'rgba(79, 70, 229, 0.15)',
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  title: 32,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5.0,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15.0,
    elevation: 8,
  },
};
