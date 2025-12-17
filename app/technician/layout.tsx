import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'CircleTel Technician',
  description: 'Field technician job management and tracking',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CircleTel Tech',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F5831F',
};

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
