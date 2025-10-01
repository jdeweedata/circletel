'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Wifi, Zap, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Package {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
}

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
}

export default function PackagesPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [leadId]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`/api/coverage/packages?leadId=${leadId}`);
      if (!response.ok) throw new Error('Failed to fetch packages');

      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowSignupForm(true);
  };

  const handleSendOtp = async () => {
    if (!customerDetails.email) {
      toast.error('Please enter your email address');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerDetails.email,
          type: 'signup',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        toast.success('Verification code sent to your email!');
      } else {
        toast.error(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerDetails.email,
          otp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOtpVerified(true);
        toast.success('Email verified successfully!');
      } else {
        toast.error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!otpVerified) {
      toast.error('Please verify your email first');
      return;
    }

    if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.phone || !customerDetails.idNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          packageId: selectedPackage?.id,
          customer: customerDetails,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Order placed successfully!');
        router.push(`/order/confirmation?orderId=${data.orderId}`);
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
            Available Packages
          </h1>
          <p className="text-lg text-circleTel-secondaryNeutral">
            Great news! We have service available at your location
          </p>
        </div>

        {!showSignupForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-circleTel-orange" />
                    {pkg.name}
                  </CardTitle>
                  <CardDescription>{pkg.service_type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-circleTel-darkNeutral">
                        R{pkg.promotion_price || pkg.price}
                      </span>
                      <span className="text-sm text-gray-500">/month</span>
                    </div>

                    {pkg.promotion_price && (
                      <div className="text-sm text-green-600">
                        Save R{pkg.price - pkg.promotion_price}/month for {pkg.promotion_months} months
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-circleTel-orange" />
                      <span>{pkg.speed_down}Mbps down / {pkg.speed_up}Mbps up</span>
                    </div>

                    <p className="text-sm text-gray-600">{pkg.description}</p>

                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePackageSelect(pkg)}
                      className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                    >
                      Select Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Complete Your Order</CardTitle>
              <CardDescription>
                {selectedPackage?.name} - R{selectedPackage?.promotion_price || selectedPackage?.price}/month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={customerDetails.firstName}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, firstName: e.target.value })}
                    disabled={otpVerified}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={customerDetails.lastName}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, lastName: e.target.value })}
                    disabled={otpVerified}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                    disabled={otpSent}
                  />
                  {!otpSent && (
                    <Button
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !customerDetails.email}
                    >
                      {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
                    </Button>
                  )}
                  {otpVerified && (
                    <Button disabled className="bg-green-500">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* OTP Verification */}
              {otpSent && !otpVerified && (
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                    >
                      {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Check your email for the verification code
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  disabled={!otpVerified}
                />
              </div>

              <div>
                <Label htmlFor="idNumber">ID Number *</Label>
                <Input
                  id="idNumber"
                  value={customerDetails.idNumber}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, idNumber: e.target.value })}
                  disabled={!otpVerified}
                />
              </div>

              {/* Terms and Conditions */}
              {otpVerified && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-circleTel-orange mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">By placing this order you agree to:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>CircleTel&apos;s Terms of Service and conditions</li>
                        <li>Privacy Policy and data processing</li>
                        <li>24-month service contract</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSignupForm(false)}
                  className="flex-1"
                >
                  Back to Packages
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={!otpVerified || placingOrder}
                  className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}