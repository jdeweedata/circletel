import { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { DeviceCard } from '@/components/ui/device-card'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'TP-Link Deco X50 | CircleTel',
  description: 'View specs for the TP-Link X50 3-pack mesh WiFi system.',
}

export default function TPLinkDecoX50Page() {
  return (
    <div className="min-h-screen bg-white antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-600 to-pink-700 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="flex gap-4 mb-6">
                <button className="w-16 h-16 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" />
                <button className="w-16 h-16 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" />
                <button className="w-16 h-16 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" />
                <button className="w-16 h-16 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" />
              </div>
              <div className="relative aspect-square max-w-md mx-auto">
                <Image
                  src="/products/tp-link-deco-x50-3pack.webp"
                  alt="TP-Link Deco X50 3-Pack"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">TP-Link X50 3-Pack</h1>
              <h2 className="text-2xl mb-6">WiFi 6 mesh system</h2>
              <div className="text-3xl font-bold mb-6">R5 999.00</div>
              <p className="text-lg leading-relaxed mb-8">
                Kill WiFi dead zones with the TP-Link Deco X50. The Deco X50 is a mesh WiFi 6 system designed to deliver a huge boost in coverage, speed, and total WiFi capacity throughout your whole house.
              </p>
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg">
                Buy now
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative wave element */}
        <div className="absolute bottom-0 right-0 w-1/3 h-32 bg-cyan-400 rounded-tl-[100px]" />
      </section>

      {/* Compatible With Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-2xl font-bold mb-10 text-gray-900">Compatible with.</p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-pink-600 px-6 py-2 rounded-full text-white font-medium">Fibre</span>
            <span className="bg-pink-600 px-6 py-2 rounded-full text-white font-medium">Mesh</span>
            <span className="bg-gray-200 px-6 py-2 rounded-full text-gray-600 font-medium">Mobile</span>
            <span className="bg-gray-200 px-6 py-2 rounded-full text-gray-600 font-medium">VoIP</span>
            <span className="bg-gray-200 px-6 py-2 rounded-full text-gray-600 font-medium">Wireless</span>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-2xl font-bold mb-10 text-gray-900">Key features.</p>

          <div className="space-y-8 max-w-4xl">
            <p className="text-lg leading-8 text-gray-700">
              <strong className="font-semibold text-gray-900">Say goodbye to WiFi dead zones in your home.</strong><br />
              TP-Link Deco units work together to form one unified network. With clearer and stronger signals enhanced by BSS Color and Beamforming, Deco X50 3-pack boosts broader whole home WiFi up to 603 square metres
            </p>

            <p className="text-lg leading-8 text-gray-700">
              <strong className="font-semibold text-gray-900">More ways to connect.</strong><br />
              Wireless connections and optional Ethernet backhaul work together to link TP-Link Deco units, providing even faster network speeds and truly seamless coverage. Want more coverage? Simply add another Deco. And best of all, the Deco mesh WiFi is compatible with existing Fibre WiFi routers sold by CircleTel.
            </p>

            <p className="text-lg leading-8 text-gray-700">
              <strong className="font-semibold text-gray-900">Seamless WiFi experience.</strong><br />
              Your phone or tablet automatically connects to the fastest TP-Link Deco as you move through your home, creating a truly seamless WiFi experience. With enhanced whole-home coverage and seamless roaming you can connect over 150 devices with faster WiFi 6 speeds and greatly reduced lag.
            </p>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-2xl font-bold mb-10 text-gray-900">Specifications.</p>

          <div className="space-y-8 max-w-4xl">
            <div>
              <p className="text-lg font-semibold mb-6 text-gray-900">Hardware.</p>
              <div className="space-y-4 text-gray-700 text-base leading-8">
                <p>3 LAN/WAN Gigabit Ethernet ports.</p>
                <p>Dimensions: 110mm x 110mm x 114mm.</p>
                <p>Weight: approx. 820g.</p>
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold mb-6 text-gray-900">Connectivity.</p>
              <div className="space-y-4 text-gray-700 text-base leading-8">
                <p>Wireless standards: IEEE 802.11 ax/ac/n/a 5 GHz, IEEE 802.11 ax/n/g/b 2.4 GHz</p>
                <p>Mesh protocol: 802.11k/v/r</p>
                <p>Wireless speed is up to 3Gbps (2.4GHz: 574Mbps; 5 GHz: 2402Mbps).</p>
                <p>TP-Link Mesh Technology: MU-MIMO, OFDMA, 1024-QAM, BSS Color, Auto Path Selection, Self-Healing, AP Steering, Band Steering, Beamforming.</p>
                <p>IPv6 compatible.</p>
                <p>Guest network: 2.4 GHz guest network x1, 5 GHz guest network x1.</p>
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold mb-6 text-gray-900">Software.</p>
              <div className="space-y-4 text-gray-700 text-base leading-8">
                <p>Security: WPA-PSK, WPA2-PSK, WPA3, SPI Firewall.</p>
                <p>TP-Link Deco App (Android 4.4+ or iOS 9.0+).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Package Contents Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-2xl font-bold mb-10 text-gray-900">Package contents.</p>

          <div className="space-y-3 max-w-4xl text-gray-700 text-base leading-8">
            <p>3x Deco X50 units.</p>
            <p>1x RJ45 Ethernet cable.</p>
            <p>3x Power adapters.</p>
            <p>1x Quick installation guide.</p>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-2xl font-bold mb-10 text-gray-900">Documentation.</p>

          <div className="max-w-4xl">
            <p className="text-lg font-semibold mb-6 text-gray-900">Terms and conditions.</p>
            <div className="space-y-4 text-gray-700 text-base leading-8">
              <p>These devices are only available to South African residents.</p>
              <p>48-hour delivery is not guaranteed, but generally attainable in major centres. If not in a prime coverage area it might take a day or two extra to be delivered.</p>
              <p>Final delivery will then be subject to client's availability and available delivery time slots in those areas.</p>
              <p>Deliveries take place during business hours on weekdays, weekends are excluded from all time calculations.</p>
              <p>Delivery times stated do not include additional delays for payment clearance. Credit card payments are verified immediately, while a delay of up to 5 working days can be expected with debit orders for verification and clearing of funds (depending on the bank payment is made from).</p>
            </div>

            <div className="mt-10 flex gap-4">
              <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                <Link href="/order?product=tp-link-deco-x50">Buy Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/promotions">View All Devices</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">You might also like.</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DeviceCard
              id="tp-link-x50-2-pack"
              title="TP-Link X50 2-Pack"
              description="WiFi 6 mesh system"
              price={3999}
              imageUrl="/products/tp-link-deco-x50-3pack.webp"
              tag="Mesh"
              features={[
                { title: "2.4GHz speed", description: "Up to 574Mbps" },
                { title: "5GHz speed", description: "Up to 2402Mbps" },
                { title: "Deco devices", description: "2" },
              ]}
              moreInfoUrl="/devices/tp-link-x50-2-pack"
              buyNowUrl="/order?product=tp-link-x50-2-pack"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}