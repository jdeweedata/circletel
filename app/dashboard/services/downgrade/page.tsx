'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  X,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  DollarSign,
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
  removedFeatures?: string[];
}

interface DowngradeData {
  currentPackage: Package;
  availableDowngrades: Package[];
}

function DowngradePageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DowngradeData | null>(null);

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
            "Free router",
          ],
        },
        availableDowngrades: [
          {
            id: "downgrade-1",
            name: "Fibre 50Mbps Uncapped",
            speed_down: 50,
            speed_up: 50,
            monthly_price: 599,
            once_off_price: 0,
            features: [
              "50Mbps download speed",
              "50Mbps upload speed",
              "Uncapped data",
              "24/7 support",
            ],
            removedFeatures: [
              "Free router (rental may apply)",
            ],
          },
          {
            id: "downgrade-2",
            name: "Fibre 25Mbps Uncapped",
            speed_down: 25,
            speed_up: 25,
            monthly_price: 449,
            once_off_price: 0,
            features: [
              "25Mbps download speed",
              "25Mbps upload speed",
              "Uncapped data",
              "Email support",
            ],
            removedFeatures: [
              "Free router (rental may apply)",
              "Phone support",
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
            <p className="text-red-600">{error || "Failed to load downgrade options"}</p>
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
          <h1 className="text-3xl font-extrabold text-gray-900">Downgrade Your Package</h1>
          <p className="text-base text-gray-600 mt-2">
            Reduce your monthly costs with a lower-tier package
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Warning Notice */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900">Important Notice</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Downgrading will reduce your internet speeds and may remove certain features. Please review the comparison carefully before proceeding.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Package */}
      <Card className="border-2 border-circleTel-orange bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-circleTel-orange text-white mb-2">Current Package</Badge>
              <CardTitle className="text-2xl font-extrabold text-gray-900">
                {data.currentPackage.name}
              </CardTitle>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Monthly Fee</p>
              <p className="text-3xl font-extrabold text-circleTel-orange">
                R{data.currentPackage.monthly_price}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Download Speed</p>
                <p className="text-lg font-bold text-gray-900">{data.currentPackage.speed_down} Mbps</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upload Speed</p>
                <p className="text-lg font-bold text-gray-900">{data.currentPackage.speed_up} Mbps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downgrade Options */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Downgrades</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.availableDowngrades.map((pkg) => {
            const savings = data.currentPackage.monthly_price - pkg.monthly_price;
            const speedReduction = ((data.currentPackage.speed_down - pkg.speed_down) / data.currentPackage.speed_down * 100).toFixed(0);

            return (
              <Card
                key={pkg.id}
                className="shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-gray-200"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-extrabold text-gray-900">
                    {pkg.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-4xl font-extrabold text-green-600">
                      R{pkg.monthly_price}
                    </span>
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      Save R{savings}/month
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      {speedReduction}% slower
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

                  {/* Features Kept */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Features Included:</h4>
                    <div className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features Removed */}
                  {pkg.removedFeatures && pkg.removedFeatures.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-red-900 mb-2">You Will Lose:</h4>
                      <div className="space-y-2">
                        {pkg.removedFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span className="text-sm text-red-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Downgrade Button */}
                  <Button className="w-full mt-4 bg-gray-700 hover:bg-gray-800 text-white">
                    Downgrade to This Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Downgrade Information */}
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
                <h3 className="font-bold text-blue-900">Next Billing Cycle</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Changes take effect on your next billing date
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Immediate Savings</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Start saving on your next invoice
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
                  Your current service continues until then
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Options */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-orange-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Looking to Save Money?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-800 mb-4">
            Before downgrading, consider these alternatives that might help you save without reducing your speeds:
          </p>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-orange-600 mt-0.5" />
              <span><strong>Annual payment discount:</strong> Save up to 10% by paying annually</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-orange-600 mt-0.5" />
              <span><strong>Bundle services:</strong> Add mobile or TV for discounted rates</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-orange-600 mt-0.5" />
              <span><strong>Referral credits:</strong> Refer friends and earn monthly credits</span>
            </li>
          </ul>
          <Button className="mt-4 bg-circleTel-orange hover:bg-orange-600 text-white">
            Contact Us About Alternatives
          </Button>
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
            <h3 className="font-bold text-gray-900 mb-1">Can I upgrade again later?</h3>
            <p className="text-sm text-gray-600">
              Yes, you can upgrade back to your current package or any other package at any time.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Will I need to return equipment?</h3>
            <p className="text-sm text-gray-600">
              If your free router was included with your current package, you may need to return it or pay a monthly rental fee.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">When does the downgrade take effect?</h3>
            <p className="text-sm text-gray-600">
              Downgrades take effect at the start of your next billing cycle to ensure you receive the full value of your current package.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DowngradePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <DowngradePageContent />
    </Suspense>
  );
}
