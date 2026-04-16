import type { Theme } from 'theme-ui'

const theme: Theme = {
  initialColorModeName: 'light',
  useColorSchemeMediaQuery: true,
  useLocalStorage: true,

  colors: {
    // ── Backgrounds ──────────────────────────────────────────────────────────
    background:   '#F9FAFB',
    surface:      '#FFFFFF',
    surfaceAlt:   '#F3F4F6',

    // ── Text ─────────────────────────────────────────────────────────────────
    text:          '#111827',
    textSecondary: '#374151',
    muted:         '#6B7280',
    textLight:     '#9CA3AF',

    // ── Borders ──────────────────────────────────────────────────────────────
    border:        '#E5E7EB',
    borderMedium:  '#D1D5DB',

    // ── Brand ─────────────────────────────────────────────────────────────────
    primary:         '#1FA4FF',
    primaryBg:       '#EFF6FF',
    primaryBgStrong: '#DBEAFE',
    primaryHover:    '#0A8AE6',

    // ── Status: Success ───────────────────────────────────────────────────────
    success:         '#10B981',
    successDark:     '#059669',
    successBg:       '#D1FAE5',
    successBgStrong: '#ECFDF5',

    // ── Status: Danger ────────────────────────────────────────────────────────
    danger:          '#EF4444',
    dangerSolid:     '#DC2626',
    dangerDark:      '#991B1B',
    dangerBg:        '#FEE2E2',

    // ── Status: Warning ───────────────────────────────────────────────────────
    warning:         '#F59E0B',
    warningDark:     '#D97706',
    warningBg:       '#FEF3C7',
    warningBgStrong: '#FFFBEB',

    // ── Accents ────────────────────────────────────────────────────────────────
    purple:    '#8B5CF6',
    purpleDark: '#7C3AED',
    purpleBg:  '#EDE9FE',
    indigo:    '#4F46E5',
    indigoBg:  '#E0E7FF',

    // ════════════════════════════════════════════════════════════════════════════
    modes: {
      dark: {
        // ── Backgrounds ────────────────────────────────────────────────────────
        background:   '#0F172A',
        surface:      '#1E293B',
        surfaceAlt:   '#334155',

        // ── Text ───────────────────────────────────────────────────────────────
        text:          '#F1F5F9',
        textSecondary: '#CBD5E1',
        muted:         '#94A3B8',
        textLight:     '#64748B',

        // ── Borders ────────────────────────────────────────────────────────────
        border:       '#334155',
        borderMedium: '#475569',

        // ── Brand ──────────────────────────────────────────────────────────────
        primary:         '#38BDF8',
        primaryBg:       '#0C4A6E',
        primaryBgStrong: '#075985',
        primaryHover:    '#0EA5E9',

        // ── Status: Success ────────────────────────────────────────────────────
        success:         '#34D399',
        successDark:     '#34D399',
        successBg:       '#064E3B',
        successBgStrong: '#022C22',

        // ── Status: Danger ─────────────────────────────────────────────────────
        danger:     '#F87171',
        dangerSolid: '#F87171',
        dangerDark:  '#FCA5A5',
        dangerBg:    '#7F1D1D',

        // ── Status: Warning ────────────────────────────────────────────────────
        warning:         '#FCD34D',
        warningDark:     '#FCD34D',
        warningBg:       '#78350F',
        warningBgStrong: '#451A03',

        // ── Accents ────────────────────────────────────────────────────────────
        purple:    '#A78BFA',
        purpleDark: '#A78BFA',
        purpleBg:  '#2E1065',
        indigo:    '#818CF8',
        indigoBg:  '#1E1B4B',
      },
    },
  },

  fonts: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading: 'inherit',
    monospace: 'Menlo, monospace',
  },

  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],

  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
  },

  lineHeights: {
    body: 1.5,
    heading: 1.125,
  },

  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],

  sizes: {
    container: 1200,
  },

  radii: {
    none: '0',
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.5rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  },

  text: {
    heading: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
    },
  },

  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
      background: 'background',
      color: 'text',
    },
    a: {
      color: 'primary',
      textDecoration: 'none',
      ':hover': { textDecoration: 'underline' },
    },
  },
}

export default theme
