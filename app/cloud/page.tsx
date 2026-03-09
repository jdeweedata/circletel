'use client';

import {
  PiArrowRightBold,
  PiCheckBold,
  PiCloudBold,
  PiCloudArrowUpBold,
  PiDesktopTowerBold,
  PiGlobeBold,
  PiHardDrivesBold,
  PiHeadsetBold,
  PiLockBold,
  PiRocketBold,
  PiShieldCheckBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CloudPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-navy mb-6">
                <span className="text-circleTel-orange">Cloud & Hosting</span> Solutions
              </h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Business-grade cloud infrastructure without the complexity. Web hosting, cloud backup, migration services and virtual desktops — all managed by your local IT partner.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
                  <Link href="/contact">Get a Quote</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
                >
                  <Link href="/cloud/hosting">View Hosting Plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why CircleCloud Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-navy mb-4">Why Choose CircleCloud?</h2>
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                Enterprise-grade cloud services designed for South African businesses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <PiShieldCheckBold className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Imunify360 protection, automated backups, and SSL included on all plans
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <PiRocketBold className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">High Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    LiteSpeed servers, NVMe storage, and CloudLinux for consistent speed
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <PiHeadsetBold className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Local Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Direct WhatsApp access to technicians — no call centre queues
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <PiGlobeBold className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">99.9% Uptime SLA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    Guaranteed availability with service credits if we fall short
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cloud Services */}
        <section className="bg-circleTel-lightNeutral py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-circleTel-navy mb-4">Cloud Services</h2>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Everything your business needs in the cloud
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Web Hosting */}
              <Card className="border-2 border-circleTel-orange">
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-circleTel-orange/10 rounded-full mx-auto mb-4">
                    <PiDesktopTowerBold className="h-8 w-8 text-circleTel-orange" />
                  </div>
                  <CardTitle className="text-center">CircleCloud Hosting</CardTitle>
                  <div className="text-center">
                    <Badge className="bg-circleTel-orange">From R199/mo</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-circleTel-secondaryNeutral mb-4">
                    Business-grade web hosting with cPanel, free SSL, and daily backups included.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">LiteSpeed web server</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">1-click WordPress installer</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Free website migration</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Email hosting included</span>
                    </li>
                  </ul>
                  <Button asChild className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark">
                    <Link href="/cloud/hosting">View Hosting Plans</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Cloud Backup */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                    <PiHardDrivesBold className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-center">Cloud Backup</CardTitle>
                  <div className="text-center">
                    <Badge variant="outline" className="border-blue-600 text-blue-600">Data Protection</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-circleTel-secondaryNeutral mb-4">
                    Automated off-site backups for your business data. Sleep easy knowing your files are safe.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Automated daily backups</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">256-bit AES encryption</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Quick file recovery</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">30-day retention</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    <Link href="/cloud/backup">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Cloud Migration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4">
                    <PiCloudArrowUpBold className="h-8 w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-center">Cloud Migration</CardTitle>
                  <div className="text-center">
                    <Badge variant="outline" className="border-emerald-600 text-emerald-600">Move to Cloud</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-circleTel-secondaryNeutral mb-4">
                    Seamlessly migrate your servers and data to the cloud with minimal disruption.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Full migration planning</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Zero-downtime cutover</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Data integrity verified</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Post-migration support</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                    <Link href="/cloud/migration">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Virtual Desktops */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mx-auto mb-4">
                    <PiCloudBold className="h-8 w-8 text-violet-600" />
                  </div>
                  <CardTitle className="text-center">Virtual Desktops</CardTitle>
                  <div className="text-center">
                    <Badge variant="outline" className="border-violet-600 text-violet-600">Remote Work</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-circleTel-secondaryNeutral mb-4">
                    Secure virtual desktops for remote and hybrid teams. Work from anywhere.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Windows or Linux desktops</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Access from any device</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Centralized management</span>
                    </li>
                    <li className="flex items-start">
                      <PiCheckBold className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Enterprise security</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white">
                    <Link href="/cloud/virtual-desktops">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Single Provider Value Prop */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-circleTel-navy rounded-2xl p-8 md:p-12 text-center">
                <PiLockBold className="h-12 w-12 text-circleTel-orange mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  One Provider. One Bill. One Team.
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  Bundle your cloud services with CircleTel connectivity and Managed IT for a complete digital infrastructure solution. Save up to 10% when you bundle.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
                    <Link href="/contact">Talk to an Expert</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-circleTel-navy"
                  >
                    <Link href="/services">
                      View Managed IT <PiArrowRightBold className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-circleTel-navy mb-6">
                Ready to Move to the Cloud?
              </h2>
              <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                Let us design a cloud solution that fits your business needs and budget. Free consultation, no obligations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
                  <Link href="/contact">Get Started</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
                >
                  <Link href="https://wa.me/27824873900?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20CircleCloud%20services">
                    WhatsApp Us <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
