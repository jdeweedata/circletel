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

        {/* Zoho PageSense — raw script tag so id="pagesenseCode" is preserved in HTML */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script id="pagesenseCode" dangerouslySetInnerHTML={{ __html: `!function(){var e="1.0",t=document,a=window,n="zps-page-screen",r=t.head||t.getElementsByTagName("head")[0],i=t.getElementById("pagesenseCode");if(!t.getElementById(n)){var o=t.createElement("style");o.type="text/css",o.id=n;var s="body { background: transparent !important; opacity: 0 !important; visibility: hidden !important; } html { opacity: 0 !important; visibility: hidden !important; }";o.styleSheet?o.styleSheet.cssText=s:o.appendChild(t.createTextNode(s)),r.firstChild?r.insertBefore(o,r.firstChild):r.appendChild(o),a._ps_conf={};var c={addScript:function(e){try{var n=t.createElement("script");if(n.type="text/javascript",n.async=!0,e.src?n.src=e.src:e.text&&(void 0!==n.text?n.text=e.text:n.appendChild(t.createTextNode(e.text))),i&&i.getAttribute){var o=i.getAttribute("nonce");o&&n.setAttribute("nonce",o)}n.onload=n.onreadystatechange=function(){this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||(n.onload=n.onreadystatechange=null,a._ps_conf&&a._ps_conf.pauseRenderForManualActivation?clearTimeout(d):c.revealPage())},n.onerror=function(){c.revealPage()},r.appendChild(n)}catch(e){throw c.revealPage(),e}},revealPage:function(){var e=t.getElementById(n);e&&e.parentNode&&e.parentNode.removeChild(e)}},d=setTimeout((function(){c.revealPage()}),1e4),p=c.revealPage;c.revealPage=function(){clearTimeout(d),p()};try{a._ps_conf&&a._ps_conf.pauseRenderForManualActivation&&(a.pagesense=a.pagesense||[],a.pagesense.push=function(e){e&&"activate"==e[0]&&c&&c.revealPage()}),a._ps_conf?a._ps_conf.version=e:a._ps_conf={version:e},c.addScript({src:"https://cdn.pagesense.io/js/circletelsaptyltd/f0603d911c6347848924dba71b17e8a3.js"})}catch(e){c.revealPage()}}}}();` }} />
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