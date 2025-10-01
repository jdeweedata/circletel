'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Download,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Share2,
  Twitter,
  Facebook,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderData {
  orderId: string;
  orderNumber: string;
  packageName: string;
  serviceType: string;
  speed: {
    download: number;
    upload: number;
  };
  monthlyPrice: number;
  activationDate: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  serviceAddress: {
    street: string;
    suburb: string;
    city: string;
    province: string;
  };
}

interface OrderConfirmationProps {
  orderData: OrderData;
  className?: string;
}

export function OrderConfirmation({ orderData, className }: OrderConfirmationProps) {
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Trigger confetti animation on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Send confirmation email
    fetch('/api/orders/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: orderData.orderId })
    }).then(() => setEmailSent(true));

    return () => clearInterval(interval);
  }, [orderData.orderId]);

  const shareText = `Just signed up for ${orderData.speed.download}Mbps internet with @CircleTel! 🚀`;
  const shareUrl = `https://circletel.co.za/?ref=${orderData.orderNumber}`;

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const handleDownloadInvoice = () => {
    window.open(`/api/orders/${orderData.orderId}/invoice`, '_blank');
  };

  return (
    <div className={className}>
      {/* Success Hero */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed! 🎉
          </h1>

          <p className="text-lg text-gray-700 mb-4">
            Welcome to CircleTel, {orderData.customer.firstName}!
          </p>

          <div className="flex items-center justify-center gap-2">
            <Badge className="bg-green-600 text-white text-sm px-4 py-1">
              Order #{orderData.orderNumber}
            </Badge>
          </div>

          {emailSent && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-100 py-2 px-4 rounded-lg inline-flex">
              <Mail className="h-4 w-4" />
              <span>Confirmation email sent to {orderData.customer.email}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Confirmation Email</h4>
                    <p className="text-sm text-gray-600">
                      We've sent your order confirmation to {orderData.customer.email}. Please check your inbox (and spam folder).
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Account Setup (24 hours)</h4>
                    <p className="text-sm text-gray-600">
                      Our team will create your account and verify your details. You'll receive login credentials via email.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Installation Scheduled (2-3 days)</h4>
                    <p className="text-sm text-gray-600">
                      A technician will contact you to schedule installation at your convenience. Expected activation: <strong>{orderData.activationDate}</strong>
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Installation Complete</h4>
                    <p className="text-sm text-gray-600">
                      Once installed, you&apos;ll be enjoying high-speed internet with CircleTel. Welcome aboard!
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle>Your Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Package</p>
                  <p className="font-semibold text-gray-900">{orderData.packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service Type</p>
                  <Badge variant="outline">{orderData.serviceType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Speed</p>
                  <p className="font-semibold text-gray-900">
                    {orderData.speed.download}↓ / {orderData.speed.upload}↑ Mbps
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Cost</p>
                  <p className="font-semibold text-orange-500">R{orderData.monthlyPrice}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Installation Address</p>
                    <p className="text-gray-900">
                      {orderData.serviceAddress.street}<br />
                      {orderData.serviceAddress.suburb}, {orderData.serviceAddress.city}<br />
                      {orderData.serviceAddress.province}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-orange-500" />
                Share the Good News
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Know someone who needs better internet? Share CircleTel and help them get connected!
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  className="flex-1"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('facebook')}
                  className="flex-1"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('whatsapp')}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="tel:0123456789">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us: 012 345 6789
                </a>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:support@circletel.co.za">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </a>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://wa.me/27123456789" target="_blank">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp Chat
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadInvoice}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/terms" target="_blank">
                  <Download className="h-4 w-4 mr-2" />
                  Terms & Conditions
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg text-orange-900">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800">
                Save our support number in your phone now! We're available 24/7 to help with any questions during installation and beyond.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg" asChild>
            <a href="/">
              Back to Homepage
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
