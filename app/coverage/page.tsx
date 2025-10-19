'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, Shield, Clock, CheckCircle, Signal, Zap, Award } from 'lucide-react';
import { PricingGrid } from '@/components/coverage/PricingGrid';
import { NoCoverageLeadForm } from '@/components/coverage/NoCoverageLeadForm';

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  product_category: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
}

interface CoverageResult {
  available: boolean;
  leadId: string;
  address: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  packages: ServicePackage[];
}

export default function CoveragePage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CoverageResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'input' | 'checking' | 'results' | 'no-coverage'>('input');
  const [noCoverageCoordinates, setNoCoverageCoordinates] = useState<{ lat: number; lng: number } | undefined>();

  const handleCoverageCheck = async () => {
    if (!address.trim()) return;

    setLoading(true);
    setCurrentStep('checking');

    try {
      // Step 1: Create a coverage lead
      const createLeadResponse = await fetch('/api/coverage/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() })
      });

      if (!createLeadResponse.ok) {
        throw new Error('Failed to create coverage lead');
      }

      const leadData = await createLeadResponse.json();
      const leadId = leadData.id;

      // Step 2: Get available packages for the lead
      const packagesResponse = await fetch(`/api/coverage/packages?leadId=${leadId}`);

      if (!packagesResponse.ok) {
        throw new Error('Failed to fetch packages');
      }

      const packagesData = await packagesResponse.json();

      if (packagesData.available) {
        setResults({
          available: true,
          leadId: packagesData.leadId,
          address: packagesData.address,
          coordinates: packagesData.coordinates,
          services: packagesData.services,
          packages: packagesData.packages
        });
        setCurrentStep('results');
      } else {
        // No coverage - show lead capture form
        setNoCoverageCoordinates(packagesData.coordinates);
        setCurrentStep('no-coverage');
      }
    } catch (error) {
      console.error('Coverage check failed:', error);
      alert('Coverage check failed. Please try again.');
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setLoading(true);
          setCurrentStep('checking');

          try {
            // Step 1: Create a coverage lead with coordinates
            const createLeadResponse = await fetch('/api/coverage/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: 'Current Location',
                latitude: coordinates.lat,
                longitude: coordinates.lng
              })
            });

            if (!createLeadResponse.ok) {
              throw new Error('Failed to create coverage lead');
            }

            const leadData = await createLeadResponse.json();
            const leadId = leadData.id;

            // Step 2: Get available packages for the lead
            const packagesResponse = await fetch(`/api/coverage/packages?leadId=${leadId}`);

            if (!packagesResponse.ok) {
              throw new Error('Failed to fetch packages');
            }

            const packagesData = await packagesResponse.json();

            if (packagesData.available) {
              setResults({
                available: true,
                leadId: packagesData.leadId,
                address: packagesData.address,
                coordinates: packagesData.coordinates,
                services: packagesData.services,
                packages: packagesData.packages
              });
              setCurrentStep('results');
            } else {
              // No coverage - show lead capture form
              setNoCoverageCoordinates(packagesData.coordinates);
              setCurrentStep('no-coverage');
            }
          } catch (error) {
            console.error('Coverage check failed:', error);
            alert('Coverage check failed. Please try again.');
            setCurrentStep('input');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation failed:', error);
          alert('Unable to get your location. Please enter your address manually.');
        }
      );
    }
  };

  const resetCheck = () => {
    setCurrentStep('input');
    setResults(null);
    setAddress('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" alt="CircleTel" className="h-8 w-auto" />
              <span className="text-xl font-bold text-circleTel-darkNeutral">CircleTel</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Home</Link>
              <Link href="/bundles" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Bundles</Link>
              <Link href="/contact" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-circleTel-darkNeutral mb-6">
            Find out what speeds are waiting at
            <span className="text-circleTel-orange"> your address</span>
          </h1>
          <p className="text-xl text-circleTel-secondaryNeutral mb-8 max-w-2xl mx-auto">
            Get the right connectivity solution for your business — powered by MTN&apos;s network.
            Coverage check takes just 10 seconds. No lengthy forms.
          </p>

          {/* Coverage Check Input */}
          {currentStep === 'input' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-circleTel-lightNeutral">
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-circleTel-secondaryNeutral w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Enter your business address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 h-14 text-lg border-circleTel-lightNeutral focus:border-circleTel-orange"
                    onKeyPress={(e) => e.key === 'Enter' && handleCoverageCheck()}
                  />
                </div>
                <Button
                  onClick={handleCoverageCheck}
                  disabled={!address.trim() || loading}
                  className="h-14 px-8 bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold text-lg"
                >
                  Show me my options
                </Button>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleUseCurrentLocation}
                  className="text-circleTel-orange hover:text-circleTel-orange/80 font-medium flex items-center gap-2 mx-auto"
                >
                  <MapPin className="w-4 h-4" />
                  or use my current location
                </button>
              </div>
            </div>
          )}

          {/* Checking State */}
          {currentStep === 'checking' && (
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-circleTel-lightNeutral">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-circleTel-orange mb-6"></div>
                <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">
                  Checking coverage at your location...
                </h3>
                <p className="text-circleTel-secondaryNeutral">
                  Scanning MTN network and fibre providers
                </p>
              </div>
            </div>
          )}

          {/* No Coverage - Lead Capture Form */}
          {currentStep === 'no-coverage' && (
            <div className="max-w-2xl mx-auto">
              <NoCoverageLeadForm
                address={address}
                coordinates={noCoverageCoordinates}
                onSuccess={resetCheck}
                onCancel={resetCheck}
              />
            </div>
          )}

          {/* Results */}
          {currentStep === 'results' && results && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral">
                    Great news! We&apos;ve got you covered
                  </h3>
                </div>
              </div>

              <PricingGrid
                coverageOptions={[]}
                packages={results.packages}
                onPackageSelect={(packageId) => {
                  // Handle package selection - could navigate to order page
                  console.log('Selected package:', packageId);
                  window.location.href = `/order?package=${packageId}`;
                }}
              />

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetCheck}
                  variant="outline"
                  className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange/10 px-8"
                >
                  Check Another Location
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section - Only show when not in results */}
        {currentStep !== 'results' && (
          <>
            {/* Trust Signals */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <Card className="text-center border-circleTel-lightNeutral">
                <CardContent className="pt-6">
                  <Signal className="w-12 h-12 text-circleTel-orange mx-auto mb-4" />
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">96% Coverage</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    Powered by MTN&apos;s extensive network across South Africa
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-circleTel-lightNeutral">
                <CardContent className="pt-6">
                  <Zap className="w-12 h-12 text-circleTel-orange mx-auto mb-4" />
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Free Installation</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    No hidden fees. We handle everything, you just plug in and start
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-circleTel-lightNeutral">
                <CardContent className="pt-6">
                  <Award className="w-12 h-12 text-circleTel-orange mx-auto mb-4" />
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Business Grade</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    Enterprise solutions with 24/7 South African support
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Reasons to Choose CircleTel */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
                Why South African businesses choose CircleTel
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                <div className="text-center">
                  <div className="bg-circleTel-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Load Shedding Ready</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    UPS backup solutions keep your business running during power outages
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-circleTel-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Multi-Provider Network</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    Access to MTN, Vodacom, Telkom and fibre providers for best coverage
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-circleTel-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Same-Day Installation</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    Get connected fast with our rapid deployment team
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-circleTel-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">No Long Contracts</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    Flexible month-to-month options with no exit penalties
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-circleTel-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">POPIA Compliant</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    Enterprise-grade security meeting all SA data protection requirements
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-circleTel-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-circleTel-orange" />
                  </div>
                  <h3 className="font-bold text-circleTel-darkNeutral mb-2">Local Support</h3>
                  <p className="text-circleTel-secondaryNeutral text-sm">
                    24/7 South African support team that understands your business
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}