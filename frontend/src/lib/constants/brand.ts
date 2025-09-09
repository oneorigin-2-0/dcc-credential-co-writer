/**
 * DCC Brand Constants
 * Based on official DCC Branding Template guidelines
 */

// DCC Brand Color Palette
export const DCC_COLORS = {
    // Primary brand colors from palette
    creamyYellow: '#DDD78D',
    calmTeal: '#429EA6',
    deepBlue: '#234467',
    regalPurple: '#320E3B',
    darkGrey: '#40464c',
    lightGrey: '#626a73',

    // Semantic color mapping
    primary: '#234467',      // Deep Blue - serious, professional
    secondary: '#429EA6',    // Calm Teal - supportive, fresh
    accent: '#DDD78D',       // Creamy Yellow - warm, approachable
    purple: '#320E3B',       // Regal Purple - premium, sophisticated
    textPrimary: '#40464c',  // Dark Grey - readable, neutral
    textSecondary: '#626a73', // Light Grey - subtle, muted

    // Additional utility colors
    white: '#FFFFFF',
    black: '#000000',
} as const;

// Typography System - Roboto Font Family
export const DCC_FONTS = {
    // Headlines: Roboto Serif
    headline: {
        family: 'Roboto Serif',
        weights: {
            // Font-size >= 30pt use Roboto Serif Black
            large: '900', // Black
            // Font-size < 30pt use Roboto Serif Bold  
            medium: '700', // Bold
        }
    },

    // Subheads: Roboto Mono
    subhead: {
        family: 'Roboto Mono',
        weights: {
            // Font-size >= 18pt use Roboto Mono Bold
            large: '700', // Bold
            // Font-size < 18pt use Roboto Mono Light
            small: '300', // Light
        }
    },

    // Body text: Roboto Light
    body: {
        family: 'Roboto',
        weight: '300', // Light
    },

    // Website text: Roboto (Light) - replaces Open Sans
    website: {
        family: 'Roboto',
        weight: '300', // Light
    }
} as const;

// Font size breakpoints for weight selection
export const FONT_SIZE_BREAKPOINTS = {
    headline: 30, // 30pt - use Black above, Bold below
    subhead: 18,  // 18pt - use Bold above, Light below
} as const;

// CSS Font Stack definitions
export const FONT_STACKS = {
    headline: `"Roboto Serif", serif`,
    subhead: `"Roboto Mono", monospace`,
    body: `"Roboto", sans-serif`,
    website: `"Roboto", sans-serif`,
} as const;

// Tailwind font family classes
export const TAILWIND_FONTS = {
    headline: 'font-headline',
    subhead: 'font-subhead',
    body: 'font-body',
    website: 'font-website',
} as const;

// Complete DCC Brand System
export const DCC_BRAND = {
    name: 'DCC',
    colors: DCC_COLORS,
    fonts: DCC_FONTS,
    fontStacks: FONT_STACKS,
    tailwindFonts: TAILWIND_FONTS,
} as const;

// Helper function to convert hex to HSL for CSS custom properties
export function hexToHsl(hex: string): string {
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

// DCC Colors in HSL format for CSS custom properties
export const DCC_COLORS_HSL = {
    primary: hexToHsl(DCC_COLORS.primary),
    secondary: hexToHsl(DCC_COLORS.secondary),
    accent: hexToHsl(DCC_COLORS.accent),
    purple: hexToHsl(DCC_COLORS.purple),
    textPrimary: hexToHsl(DCC_COLORS.textPrimary),
    textSecondary: hexToHsl(DCC_COLORS.textSecondary),
    creamyYellow: hexToHsl(DCC_COLORS.creamyYellow),
    calmTeal: hexToHsl(DCC_COLORS.calmTeal),
    deepBlue: hexToHsl(DCC_COLORS.deepBlue),
    regalPurple: hexToHsl(DCC_COLORS.regalPurple),
    darkGrey: hexToHsl(DCC_COLORS.darkGrey),
    lightGrey: hexToHsl(DCC_COLORS.lightGrey),
} as const;