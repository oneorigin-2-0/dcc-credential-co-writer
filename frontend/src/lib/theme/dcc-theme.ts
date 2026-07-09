/**
 * DCC Brand Theme Configuration
 * Centralized configuration for all colors, fonts, and design tokens
 */

// DCC Brand Colors (Hex values from brand guidelines)
export const DCC_BRAND_COLORS = {
  creamyYellow: '#DDD78D',
  calmTeal: '#429EA6', 
  deepBlue: '#234467',
  regalPurple: '#320E3B',
  darkGrey: '#40464c',
  lightGrey: '#626a73',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Convert hex to HSL for CSS custom properties
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// DCC Theme Colors for Tailwind (HSL format)
export const DCC_THEME_COLORS = {
  // Light mode
  light: {
    background: '0 0% 100%',
    foreground: hexToHsl(DCC_BRAND_COLORS.darkGrey),
    card: '0 0% 100%',
    'card-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    popover: '0 0% 100%',
    'popover-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    primary: hexToHsl(DCC_BRAND_COLORS.deepBlue),
    'primary-foreground': '0 0% 98%',
    secondary: hexToHsl(DCC_BRAND_COLORS.calmTeal),
    'secondary-foreground': '0 0% 98%',
    muted: hexToHsl(DCC_BRAND_COLORS.creamyYellow),
    'muted-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    accent: hexToHsl(DCC_BRAND_COLORS.creamyYellow),
    'accent-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    destructive: '0 84.2% 60.2%',
    'destructive-foreground': '0 0% 98%',
    border: '210 13% 89%',
    input: '210 13% 89%',
    ring: hexToHsl(DCC_BRAND_COLORS.deepBlue),
    'chart-1': hexToHsl(DCC_BRAND_COLORS.deepBlue),
    'chart-2': hexToHsl(DCC_BRAND_COLORS.calmTeal),
    'chart-3': hexToHsl(DCC_BRAND_COLORS.creamyYellow),
    'chart-4': hexToHsl(DCC_BRAND_COLORS.regalPurple),
    'chart-5': hexToHsl(DCC_BRAND_COLORS.lightGrey),
    'sidebar-background': '0 0% 98%',
    'sidebar-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    'sidebar-primary': hexToHsl(DCC_BRAND_COLORS.deepBlue),
    'sidebar-primary-foreground': '0 0% 98%',
    'sidebar-accent': hexToHsl(DCC_BRAND_COLORS.creamyYellow),
    'sidebar-accent-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    'sidebar-border': '210 13% 89%',
    'sidebar-ring': hexToHsl(DCC_BRAND_COLORS.deepBlue),
  },
  
  // Dark mode
  dark: {
    background: '285 73% 8%', // Dark Regal Purple
    foreground: '0 0% 98%',
    card: '210 46% 15%', // Darker Deep Blue
    'card-foreground': '0 0% 98%',
    popover: '210 46% 15%',
    'popover-foreground': '0 0% 98%',
    primary: hexToHsl(DCC_BRAND_COLORS.calmTeal),
    'primary-foreground': '0 0% 98%',
    secondary: hexToHsl(DCC_BRAND_COLORS.deepBlue),
    'secondary-foreground': '0 0% 98%',
    muted: '210 13% 20%',
    'muted-foreground': '210 13% 70%',
    accent: hexToHsl(DCC_BRAND_COLORS.creamyYellow),
    'accent-foreground': hexToHsl(DCC_BRAND_COLORS.darkGrey),
    destructive: '0 62.8% 30.6%',
    'destructive-foreground': '0 0% 98%',
    border: '210 13% 25%',
    input: '210 13% 25%',
    ring: hexToHsl(DCC_BRAND_COLORS.calmTeal),
    'chart-1': hexToHsl(DCC_BRAND_COLORS.calmTeal),
    'chart-2': hexToHsl(DCC_BRAND_COLORS.deepBlue),
    'chart-3': hexToHsl(DCC_BRAND_COLORS.creamyYellow),
    'chart-4': hexToHsl(DCC_BRAND_COLORS.regalPurple),
    'chart-5': '210 13% 60%',
    'sidebar-background': '210 46% 12%',
    'sidebar-foreground': '0 0% 98%',
    'sidebar-primary': hexToHsl(DCC_BRAND_COLORS.calmTeal),
    'sidebar-primary-foreground': '0 0% 98%',
    'sidebar-accent': '210 13% 25%',
    'sidebar-accent-foreground': '0 0% 98%',
    'sidebar-border': '210 13% 25%',
    'sidebar-ring': hexToHsl(DCC_BRAND_COLORS.calmTeal),
  }
} as const;

// DCC Typography Configuration
export const DCC_TYPOGRAPHY = {
  // Font families
  fonts: {
    headline: ['var(--font-headline)', 'Roboto Serif', 'serif'],
    subhead: ['var(--font-subhead)', 'Roboto Mono', 'monospace'],
    body: ['var(--font-body)', 'Roboto', 'sans-serif'],
    website: ['var(--font-website)', 'Roboto', 'sans-serif'],
    code: ['Roboto Mono', 'monospace'],
  },
  
  // Font weights based on DCC guidelines
  weights: {
    headline: {
      // Font-size >= 30pt use Roboto Serif Black (900)
      large: '900',
      // Font-size < 30pt use Roboto Serif Bold (700)
      medium: '700',
    },
    subhead: {
      // Font-size >= 18pt use Roboto Mono Bold (700)
      large: '700',
      // Font-size < 18pt use Roboto Mono Light (300)
      small: '300',
    },
    body: '300', // Roboto Light
    website: '300', // Roboto Light
  },
  
  // Size breakpoints for weight selection
  breakpoints: {
    headline: 30, // 30pt
    subhead: 18,  // 18pt
  }
} as const;

// Complete DCC Theme Export
export const DCC_THEME = {
  colors: DCC_THEME_COLORS,
  typography: DCC_TYPOGRAPHY,
  brandColors: DCC_BRAND_COLORS,
} as const;