'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Wifi, Users, Home, Info } from 'lucide-react';
import { formatPrice } from '@/lib/types/products';

interface MeshDevice {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  features: {
    '2.4GHz_speed': string;
    '5GHz_speed': string;
    devices: number;
    coverage?: string;
  };
  inStock: boolean;
  tag: string;
}

const meshDevices: MeshDevice[] = [
  {
    id: 'circletel-mesh-x50-3pack',
    name: 'CircleTel Mesh X50 3-Pack',
    description: 'WiFi 6 mesh system for large homes',
    price: 5999,
    image: '/images/mesh-wifi-3pack.png',
    features: {
      '2.4GHz_speed': 'Up to 574Mbps',
      '5GHz_speed': 'Up to 2402Mbps',
      devices: 3,
      coverage: 'Up to 500m²'
    },
    inStock: true,
    tag: 'Mesh'
  },
  {
    id: 'circletel-mesh-x50-2pack',
    name: 'CircleTel Mesh X50 2-Pack',
    description: 'WiFi 6 mesh system for medium homes',
    price: 3999,
    image: '/images/mesh-wifi-2pack.png',
    features: {
      '2.4GHz_speed': 'Up to 574Mbps',
      '5GHz_speed': 'Up to 2402Mbps',
      devices: 2,
      coverage: 'Up to 300m²'
    },
    inStock: true,
    tag: 'Mesh'
  },
  {
    id: 'circletel-mesh-pro-3pack',
    name: 'CircleTel Mesh Pro 3-Pack',
    description: 'Premium WiFi 6E mesh system',
    price: 8999,
    image: '/images/mesh-wifi-pro-3pack.png',
    features: {
      '2.4GHz_speed': 'Up to 574Mbps',
      '5GHz_speed': 'Up to 4804Mbps',
      devices: 3,
      coverage: 'Up to 600m²'
    },
    inStock: true,
    tag: 'Premium'
  }
];

export default function MeshWiFiPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleMoreInfo = (deviceId: string) => {
    // Navigate to device details or open modal
    console.log(`More info for ${deviceId}`);
  };

  const handleBuyNow = (deviceId: string) => {
    // Navigate to order page or add to cart
    window.location.href = `/order?device=${deviceId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-circleTel-orange/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <Wifi className="h-16 w-16 text-circleTel-orange mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral">
              Mesh WiFi Systems
            </h1>
          </div>
          <p className="text-xl text-circleTel-secondaryNeutral mb-8 max-w-2xl mx-auto">
            Kill dead zones and boost WiFi coverage throughout your home with our premium mesh WiFi solutions.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center bg-white/50 rounded-lg p-4">
              <Home className="h-8 w-8 text-circleTel-orange mr-3" />
              <span className="font-semibold">Whole Home Coverage</span>
            </div>
            <div className="flex items-center justify-center bg-white/50 rounded-lg p-4">
              <Users className="h-8 w-8 text-circleTel-orange mr-3" />
              <span className="font-semibold">Multiple Device Support</span>
            </div>
            <div className="flex items-center justify-center bg-white/50 rounded-lg p-4">
              <Wifi className="h-8 w-8 text-circleTel-orange mr-3" />
              <span className="font-semibold">Seamless Roaming</span>
            </div>
          </div>
        </div>
      </section>

      {/* Devices Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {meshDevices.map((device) => (
            <Card key={device.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Device Image */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-48 flex items-center justify-center">
                <div className="text-8xl text-gray-300">📶</div>
                <Badge
                  className="absolute top-4 left-4 bg-circleTel-orange text-white"
                  variant="secondary"
                >
                  {device.tag}
                </Badge>
                {!device.inStock && (
                  <Badge
                    className="absolute top-4 right-4 bg-red-500 text-white"
                    variant="destructive"
                  >
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Device Info */}
              <CardHeader>
                <CardTitle className="text-circleTel-darkNeutral">{device.name}</CardTitle>
                <CardDescription className="text-circleTel-secondaryNeutral">
                  {device.description}
                </CardDescription>
                <div className="text-2xl font-bold text-circleTel-orange">
                  {formatPrice(device.price, 'ZAR')}
                </div>
              </CardHeader>

              {/* Features */}
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">2.4GHz speed</span>
                    <span className="text-sm text-circleTel-secondaryNeutral">{device.features['2.4GHz_speed']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">5GHz speed</span>
                    <span className="text-sm text-circleTel-secondaryNeutral">{device.features['5GHz_speed']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Mesh devices</span>
                    <span className="text-sm text-circleTel-secondaryNeutral">{device.features.devices}</span>
                  </div>
                  {device.features.coverage && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Coverage</span>
                      <span className="text-sm text-circleTel-secondaryNeutral">{device.features.coverage}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Actions */}
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleMoreInfo(device.id)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  More info
                </Button>
                <Button
                  className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90"
                  onClick={() => handleBuyNow(device.id)}
                  disabled={!device.inStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {device.inStock ? 'Buy now' : 'Out of Stock'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-circleTel-lightNeutral/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-circleTel-darkNeutral">
            Why Choose CircleTel Mesh WiFi?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-circleTel-orange/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-8 w-8 text-circleTel-orange" />
              </div>
              <h3 className="font-semibold mb-2">WiFi 6 Technology</h3>
              <p className="text-sm text-circleTel-secondaryNeutral">
                Latest standard for faster speeds and better efficiency
              </p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-orange/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-circleTel-orange" />
              </div>
              <h3 className="font-semibold mb-2">Whole Home Coverage</h3>
              <p className="text-sm text-circleTel-secondaryNeutral">
                Eliminate dead zones with seamless mesh coverage
              </p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-orange/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-circleTel-orange" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Devices</h3>
              <p className="text-sm text-circleTel-secondaryNeutral">
                Support for 100+ connected devices simultaneously
              </p>
            </div>

            <div className="text-center">
              <div className="bg-circleTel-orange/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-circleTel-orange" />
              </div>
              <h3 className="font-semibold mb-2">Easy Setup</h3>
              <p className="text-sm text-circleTel-secondaryNeutral">
                Quick installation with our mobile app guidance
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}