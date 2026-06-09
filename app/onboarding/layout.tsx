import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * Onboarding shares the public site chrome (navbar + footer) so the clinic
 * wizard looks and feels like the rest of circletel.co.za. No auth required.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F9FAFB]">{children}</main>
      <Footer />
    </>
  );
}
