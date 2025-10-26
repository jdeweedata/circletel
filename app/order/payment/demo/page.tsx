"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Building2, 
  QrCode, 
  Ticket, 
  Banknote,
  CheckCircle,
  ChevronRight,
  Shield,
  Zap,
  Receipt
} from "lucide-react";
import Image from "next/image";

// NetCash PayNow Payment Methods based on official documentation
const NETCASH_PAYMENT_METHODS = [
  {
    id: "card",
    name: "Card Payments",
    description: "3D Secure Credit & Debit Cards",
    icon: CreditCard,
    color: "orange",
    brands: ["Visa", "Mastercard", "American Express", "Diners Club"],
    features: ["3D Secure", "Instant verification"],
    type: "instant",
  },
  {
    id: "instant-eft",
    name: "Instant EFT",
    description: "Real-time bank payments",
    icon: Zap,
    color: "green",
    brands: ["Ozow"],
    features: ["Instant verification", "No recapture needed"],
    type: "instant",
  },
  {
    id: "capitec-pay",
    name: "Capitec Pay",
    description: "Fast payments for Capitec customers",
    icon: Building2,
    color: "blue",
    brands: ["Capitec Bank"],
    features: ["Instant", "Secure"],
    type: "instant",
  },
  {
    id: "bank-eft",
    name: "Bank EFT",
    description: "Online banking or app transfer",
    icon: Building2,
    color: "indigo",
    brands: ["All SA Banks"],
    features: ["Secure", "Direct to merchant"],
    type: "manual",
  },
  {
    id: "scan-to-pay",
    name: "Scan to Pay",
    description: "QR code & digital wallets",
    icon: QrCode,
    color: "purple",
    brands: ["SnapScan", "Zapper", "All QR wallets"],
    features: ["Universal QR", "Multiple wallets"],
    type: "instant",
  },
  {
    id: "payflex",
    name: "Payflex",
    description: "Buy Now, Pay Later",
    icon: Receipt,
    color: "pink",
    brands: ["4 installments", "Interest-free"],
    features: ["Full payment upfront", "No interest"],
    type: "bnpl",
  },
  {
    id: "1voucher",
    name: "1Voucher",
    description: "Cash voucher payments",
    icon: Ticket,
    color: "yellow",
    brands: ["29M customers"],
    features: ["Cash payment", "Trusted provider"],
    type: "voucher",
  },
  {
    id: "paymyway",
    name: "paymyway",
    description: "Available at 24,000+ stores",
    icon: Ticket,
    color: "cyan",
    brands: ["24,000+ stores"],
    features: ["Nationwide", "Cash friendly"],
    type: "voucher",
  },
  {
    id: "scode",
    name: "SCode Retail",
    description: "Barcode vouchers at retail outlets",
    icon: Banknote,
    color: "teal",
    brands: ["6,000+ outlets"],
    features: ["Barcode payment", "Nationwide"],
    type: "voucher",
  },
];

export default function PaymentDemoPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Demo order summary
  const orderSummary = {
    subtotal: 799.00,
    shipping: 0.00,
    discount: 100.00,
    total: 699.00,
    items: 2,
    delivery: "Standard (3-5 days)",
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    toast.info(`Selected: ${NETCASH_PAYMENT_METHODS.find(m => m.id === methodId)?.name}`);
  };

  const handleProceedToPayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate NetCash redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Redirecting to NetCash Pay Now...");
      console.log("Payment method:", selectedMethod);
      
      // In production, this would redirect to NetCash
      // window.location.href = netcashPaymentUrl;
    } catch (error) {
      toast.error("Payment initialization failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; text: string; hover: string }> = {
      orange: { border: "border-orange-300", bg: "bg-orange-50", text: "text-orange-600", hover: "hover:border-orange-500" },
      green: { border: "border-green-300", bg: "bg-green-50", text: "text-green-600", hover: "hover:border-green-500" },
      blue: { border: "border-blue-300", bg: "bg-blue-50", text: "text-blue-600", hover: "hover:border-blue-500" },
      indigo: { border: "border-indigo-300", bg: "bg-indigo-50", text: "text-indigo-600", hover: "hover:border-indigo-500" },
      purple: { border: "border-purple-300", bg: "bg-purple-50", text: "text-purple-600", hover: "hover:border-purple-500" },
      pink: { border: "border-pink-300", bg: "bg-pink-50", text: "text-pink-600", hover: "hover:border-pink-500" },
      yellow: { border: "border-yellow-300", bg: "bg-yellow-50", text: "text-yellow-600", hover: "hover:border-yellow-500" },
      cyan: { border: "border-cyan-300", bg: "bg-cyan-50", text: "text-cyan-600", hover: "hover:border-cyan-500" },
      teal: { border: "border-teal-300", bg: "bg-teal-50", text: "text-teal-600", hover: "hover:border-teal-500" },
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-blue-50/20 to-green-50/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            NetCash Pay Now Payment Methods
          </h1>
          <p className="text-lg text-gray-600">
            Choose from 20+ secure payment options powered by NetCash
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2 text-gray-900">NetCash Pay Now Integration</h2>
              <p className="text-sm text-gray-700 mb-3">
                This demo showcases all payment methods available through NetCash Pay Now. 
                The platform supports 3D Secure card payments, instant EFT, QR codes, BNPL, and voucher payments.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                  PCI-DSS Compliant
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  3D Secure
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
                  Instant Verification
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods Grid - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Select Payment Method</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred way to pay from {NETCASH_PAYMENT_METHODS.length} options
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {NETCASH_PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const colors = getColorClasses(method.color);
                    const isSelected = selectedMethod === method.id;
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `${colors.border} ${colors.bg} shadow-md scale-105`
                            : `border-gray-200 hover:border-gray-300 hover:shadow-sm`
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="p-1 bg-green-100 rounded-full">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-gray-100'}`}>
                            <Icon className={`h-5 w-5 ${isSelected ? colors.text : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-sm mb-0.5">{method.name}</h3>
                            <p className="text-xs text-gray-600">{method.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {method.brands.map((brand, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                                {brand}
                              </span>
                            ))}
                          </div>
                          
                          {method.type === "instant" && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Instant
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Payment Logos */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-gray-600 text-center mb-3 font-semibold">
                    Secured by NetCash Pay Now
                  </p>
                  <div className="flex items-center justify-center gap-4 flex-wrap opacity-70">
                    <div className="relative h-6 w-auto">
                      <Image 
                        src="/images/payment-logos/logo_netcash-43.png" 
                        alt="NetCash" 
                        width={80} 
                        height={24} 
                        className="object-contain" 
                      />
                    </div>
                    <div className="h-5 w-px bg-gray-300" />
                    <div className="relative h-5 w-auto">
                      <Image 
                        src="/images/payment-logos/3d-secure.png" 
                        alt="3D Secure" 
                        width={35} 
                        height={20} 
                        className="object-contain" 
                      />
                    </div>
                    <div className="relative h-5 w-auto">
                      <Image 
                        src="/images/payment-logos/verified-by-visa.png" 
                        alt="Verified by Visa" 
                        width={35} 
                        height={20} 
                        className="object-contain" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border-2 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R{orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>R{orderSummary.shipping.toFixed(2)}</span>
                  </div>
                  {orderSummary.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-R{orderSummary.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-black text-circleTel-orange">
                      R{orderSummary.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-semibold">{orderSummary.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-semibold">{orderSummary.delivery}</span>
                  </div>
                </div>

                {/* Selected Method */}
                {selectedMethod && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Payment Method</p>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {NETCASH_PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
                    </div>
                  </div>
                )}

                {/* Proceed Button */}
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!selectedMethod || isProcessing}
                  className="w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-circleTel-orange text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      Proceed to Payment
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be redirected to NetCash Pay Now to complete your payment securely
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
