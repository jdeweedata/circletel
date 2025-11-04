import type { Config } from "tailwindcss";

import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// CircleTel custom colors with Verizon-inspired palette
				'circleTel': {
					orange: '#F5831F',
					white: '#FFFFFF',
					darkNeutral: '#1F2937',
					secondaryNeutral: '#4B5563',
					lightNeutral: '#E6E9EF',
					// Verizon-inspired modern colors
					red: '#D52B1E',
					'red-light': '#EF4444',
					'red-dark': '#B91C1C',
					gray: {
						50: '#F9FAFB',
						100: '#F3F4F6',
						200: '#E5E7EB',
						300: '#D1D5DB',
						400: '#9CA3AF',
						500: '#6B7280',
						600: '#4B5563',
						700: '#374151',
						800: '#1F2937',
						900: '#111827',
					},
					blue: {
						50: '#EFF6FF',
						100: '#DBEAFE',
						500: '#3B82F6',
						600: '#2563EB',
						700: '#1D4ED8',
					}
				},
				// WebAfrica-inspired colors (adapted with CircleTel orange)
				'webafrica': {
					pink: '#E91E63',
					'pink-light': '#F48FB1',
					'pink-dark': '#C2185B',
					blue: '#1E4B85',
					'blue-light': '#CDD6F4',
					'blue-lighter': '#E8F0FF',
					'blue-bg': '#F5F9FF',
					'blue-dark': '#163a6b',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				// Cloud hosting animations
				'blob': {
					'0%': { transform: 'translate(0px, 0px) scale(1)' },
					'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
					'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
					'100%': { transform: 'translate(0px, 0px) scale(1)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(245, 131, 31, 0.5)' },
					'50%': { boxShadow: '0 0 20px rgba(245, 131, 31, 0.8)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				// Cloud hosting animations
				'blob': 'blob 7s infinite',
				'float': 'float 3s ease-in-out infinite',
				'spin-slow': 'spin-slow 8s linear infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			},
			// Animation delays
			animationDelay: {
				'2000': '2s',
				'4000': '4s',
				'6000': '6s'
			},
			fontFamily: {
				'sans': ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
				'mono': ['var(--font-space-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;