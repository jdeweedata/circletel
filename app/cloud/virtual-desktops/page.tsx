import VirtualDesktopsHero from '@/components/virtual-desktops/VirtualDesktopsHero';
import VirtualDesktopsFeatures from '@/components/virtual-desktops/VirtualDesktopsFeatures';
import VirtualDesktopsBenefits from '@/components/virtual-desktops/VirtualDesktopsBenefits';
import VirtualDesktopsPricing from '@/components/virtual-desktops/VirtualDesktopsPricing';
import VirtualDesktopsCTA from '@/components/virtual-desktops/VirtualDesktopsCTA';

export default function VirtualDesktops() {
  return (
    <main>
      <VirtualDesktopsHero />
      <VirtualDesktopsFeatures />
      <VirtualDesktopsBenefits />
      <VirtualDesktopsPricing />
      <VirtualDesktopsCTA />
    </main>
  );
}