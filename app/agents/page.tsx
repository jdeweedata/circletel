/**
 * Sales Agent Portal Landing Page
 *
 * Entry point for sales agents - redirects to login or dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Link2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function AgentsLandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if agent is already logged in
    const agentId = sessionStorage.getItem('agent_id');
    if (agentId) {
      router.push('/agents/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-circleTel-darkNeutral via-circleTel-secondaryNeutral to-circleTel-darkNeutral text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-circleTel-orange text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              SALES AGENT PORTAL
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Grow Your Business with{' '}
              <span className="text-circleTel-orange">CircleTel</span>
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Join our network of successful sales agents and earn competitive commissions
              by connecting businesses with reliable connectivity solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-circleTel-orange hover:bg-orange-600"
              >
                <Link href="/agents/login">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                <Link href="/contact">
                  Become an Agent
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Partner with CircleTel?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed as a sales agent
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Competitive Commissions */}
            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-circleTel-orange mb-4" />
                <CardTitle>Competitive Commissions</CardTitle>
                <CardDescription>
                  Earn attractive commissions on every accepted quote with transparent tracking
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Real-Time Dashboard */}
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-circleTel-orange mb-4" />
                <CardTitle>Real-Time Dashboard</CardTitle>
                <CardDescription>
                  Track your performance, quotes, and earnings in one convenient location
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Shareable Links */}
            <Card>
              <CardHeader>
                <Link2 className="h-12 w-12 text-circleTel-orange mb-4" />
                <CardTitle>Shareable Links</CardTitle>
                <CardDescription>
                  Get your unique quote request link to share with potential customers
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Easy Quote Creation */}
            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-circleTel-orange mb-4" />
                <CardTitle>Easy Quote Creation</CardTitle>
                <CardDescription>
                  Create professional quotes in minutes with our intuitive wizard
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quality Products */}
            <Card>
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-circleTel-orange mb-4" />
                <CardTitle>Quality Products</CardTitle>
                <CardDescription>
                  Sell enterprise-grade fibre and wireless solutions with 99.99% uptime SLA
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Full Support */}
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-circleTel-orange mb-4" />
                <CardTitle>Full Support</CardTitle>
                <CardDescription>
                  Get dedicated support from our team to help you close more deals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to start earning commissions
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-circleTel-orange text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
              <p className="text-gray-600 text-sm">
                Contact us to become a registered sales agent
              </p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-orange text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Your Link</h3>
              <p className="text-gray-600 text-sm">
                Receive your unique shareable quote request link
              </p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-orange text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Create Quotes</h3>
              <p className="text-gray-600 text-sm">
                Use our portal to create professional quotes for customers
              </p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-orange text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-lg mb-2">Earn Commission</h3>
              <p className="text-gray-600 text-sm">
                Get paid when customers accept your quotes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-circleTel-orange text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join our network of successful sales agents today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-circleTel-orange hover:bg-gray-100"
            >
              <Link href="/agents/login">
                Sign In to Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-circleTel-darkNeutral hover:bg-circleTel-secondaryNeutral text-white border-0"
            >
              <Link href="/contact">
                Contact Sales Team
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
