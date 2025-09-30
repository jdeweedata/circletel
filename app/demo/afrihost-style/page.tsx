'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  Menu,
  ShoppingCart,
  Wifi,
  Shield,
  Zap,
  Globe,
  Users,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react'

// Mock data structure that would come from Strapi
const mockLandingPageData = {
  header: {
    logo: "CircleTel",
    navigation: [
      { label: "Fibre", href: "#", hasDropdown: true },
      { label: "Wireless", href: "#", hasDropdown: true },
      { label: "AirMobile", href: "#", hasDropdown: true },
      { label: "VoIP", href: "#", hasDropdown: true },
      { label: "Hosting", href: "#", hasDropdown: true },
      { label: "Other", href: "#", hasDropdown: true },
      { label: "Devices", href: "#", hasDropdown: true }
    ],
    topNav: [
      { label: "Status", href: "#" },
      { label: "Contact", href: "#" },
      { label: "More", href: "#" }
    ],
    actionButtons: [
      { label: "Deals", variant: "outline" },
      { label: "ClientZone", variant: "default" }
    ]
  },
  hero: {
    title: "Fibre devices.",
    subtitle: "Your blazing-fast Fibre needs a blazing-fast WiFi router.",
    cta: "View device types",
    backgroundGradient: "from-cyan-400 via-blue-500 to-indigo-600"
  },
  featuredProduct: {
    name: "TP-Link EX511",
    category: "WiFi 6 Fibre Router",
    price: "R999.00",
    badge: "Fibre",
    image: "/api/placeholder/300/200",
    features: [
      { label: "Boosted speeds", value: "Dual-Band WiFi 6" },
      { label: "Ports", value: "1Gps WAN/LAN" },
      { label: "Safe network", value: "WPA3 Security" }
    ],
    actions: [
      { label: "More Info", variant: "outline" },
      { label: "Buy now", variant: "default", icon: ShoppingCart }
    ]
  },
  relatedProducts: [
    {
      icon: Wifi,
      title: "Extend your home WiFi.",
      subtitle: "Mesh WiFi system from R3 999.00",
      color: "bg-teal-500"
    },
    {
      icon: Zap,
      title: "Don't be left in the dark.",
      subtitle: "Back-up UPS power from R999.00",
      color: "bg-blue-500"
    }
  ],
  footer: {
    copyright: "© 2025 CircleTel",
    links: [
      { section: "Help", items: ["CircleTel Help Centre", "Terms and conditions", "Acceptable use policy", "Privacy policy", "Sanctions policy"] },
      { section: "Follow us", items: ["Facebook", "Twitter", "Instagram", "Youtube"] }
    ],
    brandMessage: {
      text: "Pure internet",
      highlight: "joy",
      logo: "CircleTel"
    }
  }
}

export default function AfrhostStyleDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const data = mockLandingPageData

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-slate-800 text-white text-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center space-x-6">
              {data.header.topNav.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1 hover:text-cyan-300 cursor-pointer">
                  <span>{item.label}</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              {data.header.actionButtons.map((button, idx) => (
                <Button
                  key={idx}
                  variant={button.variant as "outline" | "default"}
                  size="sm"
                  className={button.variant === "outline"
                    ? "bg-transparent border-cyan-300 text-cyan-300 hover:bg-cyan-300 hover:text-slate-800"
                    : "bg-cyan-500 hover:bg-cyan-600"
                  }
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">CT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{data.header.logo}</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {data.header.navigation.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1 text-gray-700 hover:text-red-500 cursor-pointer">
                  <span className="font-medium">{item.label}</span>
                  {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`bg-gradient-to-r ${data.hero.backgroundGradient} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold mb-6">{data.hero.title}</h1>
            <p className="text-xl mb-8 text-white/90">{data.hero.subtitle}</p>
            <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg">
              {data.hero.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 text-pink-400 opacity-60">
          <div className="text-4xl">✕</div>
        </div>
        <div className="absolute bottom-20 right-20 text-cyan-300 opacity-40">
          <div className="text-3xl">✕</div>
        </div>
        <div className="absolute top-1/2 right-1/4 text-blue-300 opacity-30">
          <div className="text-5xl">✕</div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Related Products */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related products.</h2>
              <div className="space-y-4">
                {data.relatedProducts.map((product, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`${product.color} p-3 rounded-lg`}>
                          <product.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                          <p className="text-sm text-gray-600">{product.subtitle}</p>
                          <ArrowRight className="h-4 w-4 text-gray-400 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Featured Product */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-pink-500 hover:bg-pink-600">{data.featuredProduct.badge}</Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Wifi className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {data.featuredProduct.name}
                      </h3>
                      <p className="text-gray-600">{data.featuredProduct.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-600">
                        {data.featuredProduct.price}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {data.featuredProduct.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600">{feature.label}</span>
                        <span className="font-medium text-gray-900">{feature.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    {data.featuredProduct.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.variant as "outline" | "default"}
                        className={action.variant === "default"
                          ? "bg-pink-500 hover:bg-pink-600 text-white flex-1"
                          : "flex-1"
                        }
                      >
                        {action.label}
                        {action.icon && <action.icon className="ml-2 h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Links */}
            {data.footer.links.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-lg mb-4">{section.section}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Brand Message */}
            <div className="lg:col-span-2 flex flex-col items-end">
              <div className="text-right">
                <div className="text-6xl font-bold leading-none">
                  Pure<br />
                  internet<br />
                  <span className="text-pink-500 italic">{data.footer.brandMessage.highlight}</span>
                </div>
                <div className="text-gray-400 text-sm mt-4">
                  {data.footer.brandMessage.logo}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">{data.footer.copyright}</div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Powered by</span>
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