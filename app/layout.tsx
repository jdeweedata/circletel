import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { PWAProvider } from "@/components/providers/PWAProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { GoogleMapsPreloader } from "@/components/providers/GoogleMapsPreloader";


export const metadata: Metadata = {
  title: "CircleTel - Reliable Tech Solutions",
  description: "Empowering SMEs, SOHOs, and Homes with Reliable Tech. High-Speed Wireless and Fibre Internet, Proactive IT, and Data Resilience for South African businesses.",
  keywords: ["internet", "fibre", "wireless", "IT support", "South Africa", "SME", "SOHO", "business internet"],
  authors: [{ name: "CircleTel" }],
  creator: "CircleTel",
  publisher: "CircleTel",
  metadataBase: new URL("https://www.circletel.co.za"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CircleTel - Reliable Tech Solutions",
    description: "Empowering SMEs, SOHOs, and Homes with Reliable Tech",
    url: "https://www.circletel.co.za",
    siteName: "CircleTel",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CircleTel - Reliable Tech Solutions",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CircleTel - Reliable Tech Solutions",
    description: "Empowering SMEs, SOHOs, and Homes with Reliable Tech",
    images: ["/og-image.jpg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CircleTel",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F5831F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#F5831F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#F5831F" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="min-h-screen">
        <QueryProvider>
          <PWAProvider>
            <OfflineProvider>
              <TooltipProvider>
                <GoogleMapsPreloader />
                <Toaster />
                <Sonner />
                {children}
                <Analytics />
              </TooltipProvider>
            </OfflineProvider>
          </PWAProvider>
        </QueryProvider>
      </body>
    </html>
  );
}