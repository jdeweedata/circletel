'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  ArrowRight,
  TrendingUp,
  Zap,
  Wifi,
  Clock,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface Package {
  id: string;
  name: string;
  speed_down: number;
  speed_up: number;
  monthly_price: number;
  once_off_price: number;
  features: string[];
  recommended?: boolean;
}

interface UpgradeData {
  currentPackage: Package;
  availableUpgrades: Package[];
}

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UpgradeData | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setError("No service ID provided");
      setLoading(false);
      return;
    }

    // Simulate API call - replace with actual API endpoint
    setTimeout(() => {
      setData({
        currentPackage: {
          id: serviceId,
          name: "Fibre 100Mbps Uncapped",
          speed_down: 100,
          speed_up: 100,
          monthly_price: 799,
          once_off_price: 0,
          features: [
            "100Mbps download speed",
            "100Mbps upload speed",
            "Uncapped data",
            "24/7 support",
          ],
        },
        availableUpgrades: [
          {
            id: "upgrade-1",
            name: "Fibre 200Mbps Uncapped",
            speed_down: 200,
            speed_up: 200,
            monthly_price: 999,
            once_off_price: 0,
            features: [
              "200Mbps download speed",
              "200Mbps upload speed",
              "Uncapped data",
              "Priority support",
              "Free router upgrade",
            ],
            recommended: true,
          },
          {
            id: "upgrade-2",
            name: "Fibre 500Mbps Uncapped",
            speed_down: 500,
            speed_up: 500,
            monthly_price: 1499,
            once_off_price: 0,
            features: [
              "500Mbps download speed",
              "500Mbps upload speed",
              "Uncapped data",
              "Premium support",
              "Free router upgrade",
              "Static IP included",
            ],
          },
          {
            id: "upgrade-3",
            name: "Fibre 1Gbps Uncapped",
            speed_down: 1000,
            speed_up: 1000,
            monthly_price: 1999,
            once_off_price: 0,
            features: [
              "1000Mbps (1Gbps) download speed",
              "1000Mbps (1Gbps) upload speed",
              "Uncapped data",
              "Premium support",
              "Free router upgrade",
              "Static IP included",
              "Business-grade SLA",
            ],
          },
        ],
      });
      setLoading(false);
    }, 800);
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error || "Failed to load upgrade options"}</p>
            <Link href="/dashboard">
              <Button className="mt-4 bg-circleTel-orange hover:bg-orange-600">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Upgrade Your Package</h1>
          <p className="text-base text-gray-600 mt-2">
            Get faster speeds and enhanced features
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Current Package */}
      <Card className="border-2 border-gray-300 bg-gray-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-gray-200 text-gray-700 mb-2">Current Package</Badge>
              <CardTitle className="text-2xl font-extrabold text-gray-900">
                {data.currentPackage.name}
              </CardTitle>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Monthly Fee</p>
              <p className="text-3xl font-extrabold text-gray-900">
                R{data.currentPackage.monthly_price}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Download Speed</p>
                <p className="text-lg font-bold text-gray-900">{data.currentPackage.speed_down} Mbps</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upload Speed</p>
                <p className="text-lg font-bold text-gray-900">{data.currentPackage.speed_up} Mbps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Upgrades</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data.availableUpgrades.map((pkg) => {
            const priceDifference = pkg.monthly_price - data.currentPackage.monthly_price;
            const speedIncrease = ((pkg.speed_down - data.currentPackage.speed_down) / data.currentPackage.speed_down * 100).toFixed(0);

            return (
              <Card
                key={pkg.id}
                className={`relative shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
                  pkg.recommended
                    ? 'border-4 border-circleTel-orange bg-gradient-to-br from-orange-50 to-white'
                    : 'border-2 border-gray-200'
                }`}
              >
                {pkg.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-circleTel-orange text-white px-4 py-1 text-sm font-bold shadow-lg">
                      RECOMMENDED
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-extrabold text-gray-900">
                    {pkg.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-4xl font-extrabold text-circleTel-orange">
                      R{pkg.monthly_price}
                    </span>
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      +R{priceDifference}/month
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      +{speedIncrease}% faster
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Speed Display */}
                  <div className="grid grid-cols-2 gap-3 pb-4 border-b-2">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-600">Download</p>
                      <p className="text-2xl font-extrabold text-blue-700">{pkg.speed_down}</p>
                      <p className="text-xs text-blue-600">Mbps</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-semibold text-green-600">Upload</p>
                      <p className="text-2xl font-extrabold text-green-700">{pkg.speed_up}</p>
                      <p className="text-xs text-green-600">Mbps</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  <Button
                    className={`w-full mt-4 ${
                      pkg.recommended
                        ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Upgrade Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Instant Activation</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your upgrade will be activated within 24 hours
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Pro-Rated Billing</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You'll only pay for the remaining days at the new rate
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900">No Interruption</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your service will continue without any downtime
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Will I need new equipment?</h3>
            <p className="text-sm text-gray-600">
              For speeds up to 200Mbps, your current router should work fine. For higher speeds, we may provide a free router upgrade.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Can I downgrade later?</h3>
            <p className="text-sm text-gray-600">
              Yes, you can downgrade at any time. Just visit the service management section.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">What about installation fees?</h3>
            <p className="text-sm text-gray-600">
              Upgrades typically have no installation fees. The new monthly fee starts from your next billing cycle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  );
}
