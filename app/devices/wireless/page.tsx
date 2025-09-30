'use client'

import DeviceCard from '@/components/ui/device-card'
import WifiMeshIcon from '@/components/ui/icons/wifi-mesh-icon'

const afrilostDevices = [
  {
    id: 'zte-g5ts',
    title: 'ZTE G5TS',
    description: '5G CPE WiFi 6 Router',
    price: 2499.00,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM5MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE0NSIgeT0iNzUiIHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIHJ4PSI4IiBmaWxsPSIjRjU4MzFGIi8+Cjx0ZXh0IHg9IjE5NSIgeT0iMTA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5aVEUgRzVUUzwvdGV4dD4KPC9zdmc+',
    imageAlt: 'ZTE G5TS 5G CPE WiFi 6 Router',
    tag: 'Wireless',
    features: [
      { title: 'Fast speeds', description: 'Supports 4G, 5G + Wifi 6' },
      { title: 'Dual-band WiFi', description: '2.4GHz and 5GHz' },
      { title: 'Wireless devices', description: 'Up to 64' }
    ],
    moreInfoUrl: '/devices/view/zte-g5ts',
    buyNowUrl: 'https://clientzone.afrihost.com/order/#!/new-device/'
  },
  {
    id: 'tp-link-nx510v',
    title: 'TP-Link NX510v',
    description: '5G Fixed Wireless Router',
    price: 3999.00,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM5MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjEyMCIgeT0iNzUiIHdpZHRoPSIxNTAiIGhlaWdodD0iNTAiIHJ4PSI4IiBmaWxsPSIjRjU4MzFGIi8+Cjx0ZXh0IHg9IjE5NSIgeT0iMTA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UUC1MaW5rIE5YNTU5djwvdGV4dD4KPC9zdmc+',
    imageAlt: 'TP-Link NX510v 5G Fixed Wireless Router',
    tag: 'Wireless',
    features: [
      { title: 'Fast speeds', description: 'Supports 4G, 5G + Wifi 6' },
      { title: 'Dual-band WiFi', description: '2.4GHz and 5GHz' },
      { title: 'Wireless devices', description: 'Connect over 250' }
    ],
    moreInfoUrl: '/devices/view/tp-link-nx510v',
    buyNowUrl: 'https://clientzone.afrihost.com/order/#!/new-device/'
  }
]

export default function WirelessDevicesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Wireless Devices</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Affordable, quality fixed wireless WiFi routers with 5G support and WiFi 6 technology.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiMeshIcon size={32} className="text-circleTel-orange" />
          </div>
          <h3 className="font-semibold mb-2">5G Technology</h3>
          <p className="text-muted-foreground text-sm">Ultra-fast 5G connectivity with 4G fallback</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiMeshIcon size={32} className="text-circleTel-orange" />
          </div>
          <h3 className="font-semibold mb-2">WiFi 6 Support</h3>
          <p className="text-muted-foreground text-sm">Latest WiFi standard for better performance</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiMeshIcon size={32} className="text-circleTel-orange" />
          </div>
          <h3 className="font-semibold mb-2">Dual-Band</h3>
          <p className="text-muted-foreground text-sm">2.4GHz and 5GHz for optimal coverage</p>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {afrilostDevices.map((device) => (
          <DeviceCard key={device.id} {...device} />
        ))}
      </div>

      {/* Why Choose Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose CircleTel Wireless?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="w-8 h-8 bg-circleTel-orange/10 rounded-full flex items-center justify-center mr-3">
                ⚡
              </span>
              Fast Installation
            </h3>
            <p className="text-muted-foreground">
              Professional installation within 48 hours of order confirmation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="w-8 h-8 bg-circleTel-orange/10 rounded-full flex items-center justify-center mr-3">
                🛡️
              </span>
              24/7 Support
            </h3>
            <p className="text-muted-foreground">
              Round-the-clock technical support and maintenance services.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="w-8 h-8 bg-circleTel-orange/10 rounded-full flex items-center justify-center mr-3">
                💰
              </span>
              Competitive Pricing
            </h3>
            <p className="text-muted-foreground">
              Best value wireless solutions with transparent pricing.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="w-8 h-8 bg-circleTel-orange/10 rounded-full flex items-center justify-center mr-3">
                📈
              </span>
              Scalable Solutions
            </h3>
            <p className="text-muted-foreground">
              Easy to upgrade and expand as your connectivity needs grow.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}