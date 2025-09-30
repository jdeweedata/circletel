"use client";

import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { TextReveal, TypewriterEffect } from "@/components/ui/text-reveal";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Spotlight } from "@/components/ui/spotlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  Shield,
  Clock,
  Users,
  Star,
  HomeIcon,
  MessageSquare,
  Phone,
  Settings,
  HelpCircle
} from "lucide-react";

const dockItems = [
  { title: "Home", icon: <HomeIcon className="h-full w-full" />, href: "/" },
  { title: "Wireless", icon: <Wifi className="h-full w-full" />, href: "/wireless" },
  { title: "Support", icon: <MessageSquare className="h-full w-full" />, href: "/support" },
  { title: "Contact", icon: <Phone className="h-full w-full" />, href: "/contact" },
  { title: "Settings", icon: <Settings className="h-full w-full" />, href: "/settings" },
  { title: "Help", icon: <HelpCircle className="h-full w-full" />, href: "/help" },
];

const typewriterWords = [
  { text: "Enterprise" },
  { text: "Grade", className: "text-circleTel-orange" },
  { text: "Connectivity." },
];

export default function AceternityDemo() {
  return (
    <div className="min-h-screen bg-black dark:bg-grid-white/[0.05] bg-grid-black/[0.05] relative overflow-hidden">
      {/* Spotlight Effect */}
      <Spotlight className="top-40 left-0 md:left-60 md:-top-20" fill="#F5831F" />

      {/* Background Beams */}
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/logo.svg" alt="CircleTel" className="h-8 w-auto" />
                <span className="text-xl font-bold text-white">CircleTel</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <a href="/" className="text-gray-300 hover:text-circleTel-orange transition-colors">Home</a>
                <a href="/wireless" className="text-gray-300 hover:text-circleTel-orange transition-colors">Wireless</a>
                <a href="/contact" className="text-gray-300 hover:text-circleTel-orange transition-colors">Contact</a>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          {/* Hero Section with Typewriter Effect */}
          <section className="text-center mb-20">
            <div className="mb-8">
              <TypewriterEffect words={typewriterWords} className="text-white" />
            </div>

            <TextReveal
              text="Powered by South Africa's most trusted network infrastructure"
              className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
            />

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="bg-black text-white flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>4.8/5 Rating</span>
              </HoverBorderGradient>

              <HoverBorderGradient
                containerClassName="rounded-full"
                className="bg-black text-white flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Enterprise Security</span>
              </HoverBorderGradient>

              <HoverBorderGradient
                containerClassName="rounded-full"
                className="bg-black text-white flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>24/7 SA Support</span>
              </HoverBorderGradient>
            </div>

            <Button
              size="lg"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-4 text-lg"
            >
              Explore Our Solutions
            </Button>
          </section>

          {/* Animated Cards Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Why Choose CircleTel?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-circleTel-orange/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-circleTel-orange/30 transition-colors">
                    <Wifi className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-white">Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Get speeds up to 200Mbps with our enterprise-grade wireless solutions.
                    Perfect for businesses that need reliable, high-speed connectivity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-circleTel-orange/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-circleTel-orange/30 transition-colors">
                    <Clock className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-white">Rapid Deployment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Get connected in 48 hours or less. No lengthy installations or waiting periods.
                    Just plug in and start working immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-circleTel-orange/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-circleTel-orange/30 transition-colors">
                    <Shield className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-white">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    POPIA compliant with enterprise-grade security. Your business data
                    is protected with the highest industry standards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Floating Dock */}
          <section className="mb-20">
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Quick Navigation
            </h3>
            <div className="flex justify-center">
              <FloatingDock items={dockItems} />
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-300 mb-6">
                  Join thousands of South African businesses who trust CircleTel
                  for their connectivity needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
                  >
                    Check Coverage
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    View Packages
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}