import { DemoHero } from "@/components/demo/DemoHero"
import { DemoPromotionalCarousel } from "@/components/demo/DemoPromotionalCarousel"
import { DemoSavingsSection } from "@/components/demo/DemoSavingsSection"
import { DemoFAQSection } from "@/components/demo/DemoFAQSection"
import { DemoTestimonials } from "@/components/demo/DemoTestimonials"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-circleTel-gray-50">
      {/* Hero Section - Verizon-inspired with CircleTel branding */}
      <DemoHero />

      {/* Promotional Carousel - Verizon pattern with CircleTel offers */}
      <DemoPromotionalCarousel />

      {/* Savings & Bundle Section - Hybrid approach */}
      <DemoSavingsSection />

      {/* Customer Testimonials - South African focus */}
      <DemoTestimonials />

      {/* FAQ Section - Afrihost pattern enhanced */}
      <DemoFAQSection />
    </div>
  )
}