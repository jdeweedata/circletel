import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
});

export default function DashboardPrototypeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={geist.className}>{children}</div>;
}
