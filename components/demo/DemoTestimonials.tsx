"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Thabo Mthembu",
    company: "Mthembu Accounting Services",
    location: "Johannesburg",
    rating: 5,
    quote: "CircleTel's fibre has transformed our accounting practice. Video calls with clients are crystal clear, and file uploads happen instantly. The 24/7 SA support team really understands our business needs.",
    avatar: "TM",
    businessType: "Professional Services"
  },
  {
    id: 2,
    name: "Sarah van der Merwe",
    company: "Stellenbosch Marketing Co",
    location: "Cape Town",
    rating: 5,
    quote: "Moving from our old ISP to CircleTel was seamless. The installation team was professional, and we've had zero downtime in 8 months. Our creative team can now collaborate with international clients without lag.",
    avatar: "SM",
    businessType: "Creative Agency"
  },
  {
    id: 3,
    name: "Rajesh Patel",
    company: "Patel & Sons Manufacturing",
    location: "Durban",
    rating: 5,
    quote: "As a manufacturer, we need reliable internet for our warehouse management systems. CircleTel's 5G solution gave us connectivity where fibre wasn't available. Game changer for our inventory tracking.",
    avatar: "RP",
    businessType: "Manufacturing"
  }
]

export function DemoTestimonials() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2 bg-circleTel-orange/10 text-circleTel-orange border-circleTel-orange/20">
            Customer Success Stories
          </Badge>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-circleTel-darkNeutral">
            South African businesses trust CircleTel
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-circleTel-orange text-circleTel-orange" />
              ))}
            </div>
            <span className="text-2xl font-bold text-circleTel-darkNeutral">4.9</span>
          </div>

          <p className="text-lg text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Over 15,000 South African SMEs choose CircleTel for reliable business internet.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="group hover:shadow-xl transition-all duration-300 border border-circleTel-gray-200 relative">
              <CardContent className="p-8">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6">
                  <Quote className="w-8 h-8 text-circleTel-orange/20" />
                </div>

                {/* Rating */}
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-circleTel-orange text-circleTel-orange" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-circleTel-darkNeutral mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-circleTel-orange/20">
                    <AvatarImage src={`/avatars/${testimonial.avatar.toLowerCase()}.jpg`} />
                    <AvatarFallback className="bg-circleTel-orange/10 text-circleTel-orange font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="font-semibold text-circleTel-darkNeutral">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-circleTel-secondaryNeutral">
                      {testimonial.company}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-circleTel-blue-600/20 text-circleTel-blue-600">
                        {testimonial.businessType}
                      </Badge>
                      <span className="text-xs text-circleTel-secondaryNeutral">
                        {testimonial.location}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-circleTel-orange mb-2">15,000+</div>
              <div className="text-circleTel-secondaryNeutral">Business Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-circleTel-red mb-2">99.9%</div>
              <div className="text-circleTel-secondaryNeutral">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-circleTel-blue-600 mb-2">24/7</div>
              <div className="text-circleTel-secondaryNeutral">Local SA Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}