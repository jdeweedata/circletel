import type { Metadata } from "next";
import Script from "next/script";
import { draftMode } from "next/headers";
import "./globals.css";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWAProvider } from "@/components/providers/PWAProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { GoogleMapsProvider } from "@/components/providers/GoogleMapsProvider";
import { OrderContextProvider } from "@/components/order/context/OrderContext";
import { CustomerAuthProvider } from "@/components/providers/CustomerAuthProvider";
import { WhatsAppFloatingButton } from "@/components/common/WhatsAppFloatingButton";
import { StickyMobileCTA } from "@/components/navigation/StickyMobileCTA";
import { DraftModeIndicator } from "@/components/sanity/DraftModeIndicator";

export const metadata: Metadata = {
  title: "CircleTel — One Provider. One Bill. Your Office Runs.",
  description: "Business internet, mobile, email, backup, and security in one monthly payment. No four vendors. No four support queues. CircleTel handles it all — from R2,499/mo.",
  keywords: ["internet", "fibre", "wireless", "IT support", "South Africa", "SME", "SOHO", "business internet", "office-in-a-box", "business bundle", "managed internet"],
  authors: [{ name: "CircleTel" }],
  creator: "CircleTel",
  publisher: "CircleTel",
  metadataBase: new URL("https://www.circletel.co.za"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CircleTel — One Provider. One Bill. Your Office Runs.",
    description: "Business internet, mobile, email, backup, and security in one monthly payment. CircleTel handles it all — from R2,499/mo.",
    url: "https://www.circletel.co.za",
    siteName: "CircleTel",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CircleTel — One Provider. One Bill. Your Office Runs.",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CircleTel — One Provider. One Bill. Your Office Runs.",
    description: "Business internet, mobile, email, backup, and security in one monthly payment. CircleTel handles it all — from R2,499/mo.",
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
  themeColor: '#F5841E', // CircleTel Orange (official)
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: 'swap',
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-manrope",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: 'swap',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-98GKJJPFW0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-98GKJJPFW0');
          `}
        </Script>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#F5841E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#F5831F" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Zoho PageSense — synchronous load for reliable bot detection */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.pagesense.io/js/circletelsaptyltd/f0603d911c6347848924dba71b17e8a3.js" />
      </head>
      <body className="min-h-screen bg-[#F9FAFB] text-gray-900 antialiased font-sans">
        <QueryProvider>
          <PWAProvider>
            <OfflineProvider>
              <TooltipProvider>
                <GoogleMapsProvider>
                  <CustomerAuthProvider>
                    <OrderContextProvider>
                      <Toaster />
                      <Sonner />
                      <WhatsAppFloatingButton />
                      <StickyMobileCTA />
                      {isDraftMode && <DraftModeIndicator />}
                      {children}
                    </OrderContextProvider>
                  </CustomerAuthProvider>
                </GoogleMapsProvider>
              </TooltipProvider>
            </OfflineProvider>
          </PWAProvider>
        </QueryProvider>

        {/* Prismic Toolbar */}
        <Script
          src="https://static.cdn.prismic.io/prismic.js?new=true&repo=circletel"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}