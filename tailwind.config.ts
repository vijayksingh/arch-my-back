import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        success: { DEFAULT: "hsl(var(--status-success))", foreground: "hsl(var(--status-success-foreground))", muted: "hsl(var(--status-success-muted) / 0.15)" },
        error: { DEFAULT: "hsl(var(--status-error))", foreground: "hsl(var(--status-error-foreground))", muted: "hsl(var(--status-error-muted) / 0.15)" },
        warning: { DEFAULT: "hsl(var(--status-warning))", foreground: "hsl(var(--status-warning-foreground))", muted: "hsl(var(--status-warning-muted) / 0.15)" },
        info: { DEFAULT: "hsl(var(--status-info))", foreground: "hsl(var(--status-info-foreground))", muted: "hsl(var(--status-info-muted) / 0.15)" },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.015)', opacity: '0.92' },
        },
      },
      animation: {
        breathe: 'breathe 2s ease-in-out infinite',
      },
    },
  },
} satisfies Config;
