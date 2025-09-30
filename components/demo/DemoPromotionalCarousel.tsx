"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Gift, Wifi, Smartphone, CreditCard } from "lucide-react"
import { useState } from "react"

const promotionalOffers = [
  {
    id: 1,
    title: "Get the latest iPhone 15 Pro, on us",
    description: "With select CircleTel Business Internet plans and qualifying trade-in.",
    icon: Smartphone,
    color: "bg-gradient-to-br from-circleTel-orange to-circleTel-red",
    badge: "Limited Time",
    cta: "View Details"
  },
  {
    id: 2,
    title: "FREE Managed WiFi Pro for 6 months",
    description: "Enterprise-grade WiFi with 24/7 monitoring and support.",
    icon: Wifi,
    color: "bg-gradient-to-br from-circleTel-blue-600 to-circleTel-blue-700",
    badge: "New Customers",
    cta: "Learn More"
  },
  {
    id: 3,
    title: "R2,500 Installation Credit",
    description: "Professional installation and setup at no cost for qualified businesses.",
    icon: Gift,
    color: "bg-gradient-to-br from-circleTel-red to-circleTel-orange",
    badge: "Business Special",
    cta: "Get Credit"
  },
  {
    id: 4,
    title: "Plus, get a R1,000 Account Credit",
    description: "Applied to your first bill when you sign up for select business plans.",
    icon: CreditCard,
    color: "bg-gradient-to-br from-circleTel-darkNeutral to-circleTel-secondaryNeutral",
    badge: "Online Only",
    cta: "Claim Now"
  }
]

export function DemoPromotionalCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotionalOffers.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotionalOffers.length) % promotionalOffers.length)
  }

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-circleTel-darkNeutral">
            The internet you want offers you more.
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Switch to select CircleTel Business plans and get your choice of our latest offers plus account credits.
            Check which internet service is available in your area.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {promotionalOffers.map((offer) => (
                <div key={offer.id} className="w-full flex-shrink-0">
                  <Card className="border-0 shadow-2xl">
                    <CardContent className="p-0">
                      <div className={`${offer.color} text-white p-12 lg:p-16 relative overflow-hidden`}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_30%_40%,white_0.5px,transparent_0.5px)] bg-[length:20px_20px]" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <offer.icon className="w-12 h-12 lg:w-16 lg:h-16" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 text-center lg:text-left">
                            <Badge
                              variant="secondary"
                              className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm"
                            >
                              {offer.badge}
                            </Badge>

                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                              {offer.title}
                            </h3>

                            <p className="text-lg lg:text-xl mb-8 text-white/90">
                              {offer.description}
                            </p>

                            <Button
                              size="lg"
                              variant="secondary"
                              className="bg-white text-circleTel-darkNeutral hover:bg-white/90 px-8 py-3 text-lg font-semibold"
                            >
                              {offer.cta}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg border border-circleTel-gray-200 w-12 h-12"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-6 h-6 text-circleTel-darkNeutral" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg border border-circleTel-gray-200 w-12 h-12"
            onClick={nextSlide}
          >
            <ChevronRight className="w-6 h-6 text-circleTel-darkNeutral" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-3">
            {promotionalOffers.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-circleTel-orange w-8'
                    : 'bg-circleTel-gray-300 hover:bg-circleTel-gray-400'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-3 text-lg font-semibold"
          >
            Check availability in your area
          </Button>
        </div>
      </div>
    </section>
  )
}