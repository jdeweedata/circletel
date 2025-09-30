'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronDown,
  Menu,
  Search,
  Wifi,
  Shield,
  Zap,
  Globe,
  Users,
  ArrowRight,
  Star,
  CheckCircle,
  Gift,
  Smartphone,
  Play,
  MapPin,
  Phone,
  Clock,
  DollarSign
} from 'lucide-react'

// Mock data structure that would come from Strapi
const mockVerizonStyleData = {
  header: {
    logo: "CircleTel",
    navigation: [
      {
        label: "Mobile",
        href: "#",
        hasDropdown: true,
        items: ["Plans", "Phones", "Accessories", "Bring Your Device"]
      },
      {
        label: "Home Internet",
        href: "#",
        hasDropdown: true,
        items: ["Fibre Plans", "Wireless", "Business", "Check Availability"]
      },
      {
        label: "Shop",
        href: "#",
        hasDropdown: true,
        items: ["Devices", "Accessories", "Gift Cards"]
      },
      {
        label: "Deals",
        href: "#",
        hasDropdown: true,
        items: ["Current Offers", "Student Discounts", "Trade-In"]
      },
      {
        label: "Support",
        href: "#",
        hasDropdown: true,
        items: ["Help Center", "Contact Us", "Store Locator"]
      }
    ],
    actions: [
      { label: "Sign In", variant: "ghost" },
      { label: "Cart", variant: "ghost", icon: true }
    ]
  },
  hero: {
    title: "CircleTel Home Internet",
    subtitle: "Check which internet service is available in your area",
    backgroundImage: "/api/placeholder/1200/400",
    ctaText: "Check Availability"
  },
  promotionalOffers: [
    {
      title: "Nintendo Switch OLED",
      subtitle: "Get it on us when you switch",
      description: "Limited time offer with select plans",
      badge: "Limited Time",
      icon: Gift,
      color: "bg-red-500"
    },
    {
      title: "Disney+ & Hulu Bundle",
      subtitle: "Included with select plans",
      description: "Stream your favorites with no extra cost",
      badge: "Included",
      icon: Play,
      color: "bg-blue-500"
    },
    {
      title: "Up to R500 Gift Card",
      subtitle: "When you switch online",
      description: "Plus free installation",
      badge: "Online Exclusive",
      icon: DollarSign,
      color: "bg-green-500"
    }
  ],
  faqData: [
    {
      question: "What types of internet service does CircleTel offer?",
      answer: "CircleTel offers high-speed fibre internet, 5G home internet, and business solutions. Our fibre plans range from 100 Mbps to 1 Gig, perfect for streaming, gaming, and working from home."
    },
    {
      question: "How do I check availability in my area?",
      answer: "Use our availability checker above by entering your address. We'll show you all available plans and speeds in your specific location, plus any current promotions."
    },
    {
      question: "What's included with CircleTel internet plans?",
      answer: "All plans include a high-speed router, 24/7 customer support, no annual contracts, and professional installation. Select plans also include streaming services and premium features."
    },
    {
      question: "How long does installation take?",
      answer: "Professional installation typically takes 2-4 hours. We'll schedule a convenient time and our certified technicians will set up your equipment and ensure everything works perfectly."
    },
    {
      question: "Can I keep my current phone number?",
      answer: "Yes! We can port your existing number when you switch to CircleTel. The process is seamless and typically completes within 24-48 hours."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "We offer a 30-day satisfaction guarantee. If you're not happy with your service, you can cancel within 30 days with no early termination fees."
    }
  ],
  internetPlans: [
    {
      name: "Essential",
      speed: "100 Mbps",
      price: "R299/mo",
      features: ["Perfect for 1-2 devices", "Streaming in HD", "Basic gaming", "Email & web browsing"],
      popular: false
    },
    {
      name: "Pro",
      speed: "500 Mbps",
      price: "R499/mo",
      features: ["Perfect for 3-5 devices", "4K streaming", "Online gaming", "Video conferencing", "Smart home devices"],
      popular: true
    },
    {
      name: "Gig",
      speed: "1000 Mbps",
      price: "R699/mo",
      features: ["Perfect for 6+ devices", "Multiple 4K streams", "Professional gaming", "Large file uploads", "Home office"],
      popular: false
    }
  ]
}

export default function VerizonStyleDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [address, setAddress] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const data = mockVerizonStyleData

  const handleAvailabilityCheck = () => {
    // Simulate availability check
    alert(`Checking availability for: ${address}`)
  }

  return (
    <div className="min-h-screen bg-cream" style={{ backgroundColor: '#F3EDE0' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">CT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{data.header.logo}</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {data.header.navigation.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="flex items-center space-x-1 text-gray-700 hover:text-red-600 cursor-pointer py-4">
                    <span className="font-medium">{item.label}</span>
                    {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                  </div>
                  {item.hasDropdown && (
                    <div className="absolute top-full left-0 w-48 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-2">
                        {item.items?.map((subItem, subIdx) => (
                          <a
                            key={subIdx}
                            href="#"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                          >
                            {subItem}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="hidden md:flex">
                Sign In
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <Search className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="ghost"
                size="sm"
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {data.hero.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {data.hero.subtitle}
            </p>

            {/* Availability Checker */}
            <Card className="max-w-2xl mx-auto rounded-3xl shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Enter your address or postal code"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="pl-10 h-12 text-lg rounded-2xl border-2"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAvailabilityCheck}
                    className="bg-red-600 hover:bg-red-700 h-12 px-8 text-lg rounded-2xl"
                  >
                    {data.hero.ctaText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Promotional Offers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Special Offers
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {data.promotionalOffers.map((offer, idx) => (
              <Card key={idx} className="rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  <div className={`${offer.color} p-6 text-white relative`}>
                    <Badge className="absolute top-4 right-4 bg-white/20 text-white">
                      {offer.badge}
                    </Badge>
                    <offer.icon className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                    <p className="text-lg opacity-90">{offer.subtitle}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{offer.description}</p>
                    <Button variant="outline" className="w-full rounded-xl">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Internet Plans */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600">
              High-speed internet plans designed for every household
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {data.internetPlans.map((plan, idx) => (
              <Card key={idx} className={`rounded-3xl relative ${plan.popular ? 'ring-2 ring-red-600 scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-red-600 my-4">{plan.speed}</div>
                  <div className="text-2xl font-bold text-gray-900">{plan.price}</div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-xl ${plan.popular ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {data.faqData.map((faq, idx) => (
                <Collapsible
                  key={idx}
                  open={openFaq === idx}
                  onOpenChange={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <Card className="rounded-2xl">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                          <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8 mb-8">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CT</span>
                </div>
                <span className="text-xl font-bold">CircleTel</span>
              </div>
              <p className="text-gray-400 mb-6">
                Connecting South Africa with reliable, high-speed internet solutions.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fibre Internet</a></li>
                <li><a href="#" className="hover:text-white transition-colors">5G Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Solutions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile Plans</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Store Locator</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Network Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">News</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investor Relations</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-gray-400 mb-4 md:mb-0">
                © 2025 CircleTel. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 text-gray-400">
                <span>Powered by</span>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-semibold">Strapi CMS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}