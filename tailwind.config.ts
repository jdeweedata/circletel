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
				// CircleTel Official Brand Colors
				'circleTel': {
					// Primary Palette
					orange: '#F5841E',        // Circle Tel Orange - rgb(245, 132, 30)
					gray: '#747474',          // Circle Tel Grey - rgb(116, 116, 116)
					navy: '#13274A',          // Deep Navy - rgb(19, 39, 74)
					black: '#000000',
					white: '#FFFFFF',
					// Secondary Palette
					'burnt-orange': '#D76026', // rgb(215, 96, 38)
					'warm-orange': '#E97B26',  // rgb(233, 123, 38)
					'bright-orange': '#F4742B', // rgb(244, 116, 43)
					'light-gray': '#8B8B8B',   // rgb(139, 139, 139)
					'dark-gray': '#606261',    // rgb(96, 98, 97)
					'midnight-navy': '#0F1427', // rgb(15, 20, 39)
					// Legacy aliases (for backwards compatibility)
					darkNeutral: '#1F2937',
					secondaryNeutral: '#4B5563',
					lightNeutral: '#E6E9EF',
				},
				// UI Gray Scale (for backgrounds, text, borders)
				'ui': {
					bg: '#F9FAFB',             // Page background
					card: '#FFFFFF',           // Card/section background
					'text-primary': '#111827', // Near-black text
					'text-secondary': '#4B5563', // Medium gray text
					'text-muted': '#6B7280',   // Lighter gray text
					'text-dark': '#1F2937',    // Dark gray text (h1)
					sidebar: '#1F2937',        // Sidebar/nav background
					border: '#E5E7EB',         // Default border
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
				'sans': ['var(--font-poppins)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
				'mono': ['var(--font-space-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;