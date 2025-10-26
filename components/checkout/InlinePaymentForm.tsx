"use client";

import * as React from "react";
import { useState } from "react";
import { CreditCard, Package, Truck, Tag, Check, Wallet, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
interface FormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  paymentMethod: "card" | "digital-wallet" | "other";
}

interface OrderSummaryData {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: number;
  delivery: string;
}

interface InlinePaymentFormProps {
  orderSummary: OrderSummaryData;
  onSubmit: (formData: FormData) => Promise<void>;
  isProcessing?: boolean;
}

// Helper functions
function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = cleaned.match(/\d{1,4}/g);
  return matches ? matches.join(" ") : "";
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  return cleaned;
}

export default function InlinePaymentForm({ 
  orderSummary, 
  onSubmit, 
  isProcessing = false 
}: InlinePaymentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    paymentMethod: "card",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    let processedValue = value;

    if (field === "cardNumber") {
      processedValue = formatCardNumber(value).slice(0, 19);
    } else if (field === "expiryMonth" || field === "expiryYear") {
      const expiry = formatExpiry(
        (formData.expiryMonth + formData.expiryYear).replace(/\D/g, "") + value.replace(/\D/g, "")
      );
      const [month, year] = expiry.split("/");
      setFormData((prev) => ({
        ...prev,
        expiryMonth: month || "",
        expiryYear: year || "",
      }));
      return;
    } else if (field === "cvv") {
      processedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (formData.paymentMethod === "card") {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13) {
        newErrors.cardNumber = "Valid card number required";
      }
      if (!formData.expiryMonth || !formData.expiryYear) {
        newErrors.expiryMonth = "Expiry date required";
      }
      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = "Valid CVV required";
      }
      if (!formData.cardholderName.trim()) {
        newErrors.cardholderName = "Cardholder name required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const paymentMethods = [
    {
      id: "card" as const,
      icon: <CreditCard className="w-5 h-5" />,
      label: "Credit Card",
    },
    {
      id: "digital-wallet" as const,
      icon: <Wallet className="w-5 h-5" />,
      label: "Digital Wallet",
    },
    {
      id: "other" as const,
      icon: <Building2 className="w-5 h-5" />,
      label: "Other",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Payment Form */}
        <Card className="rounded-2xl border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Payment</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your payment details</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Method Tabs */}
            <div>
              <h3 className="text-base font-semibold mb-3">Payment Options</h3>
              <p className="text-sm text-muted-foreground mb-4">Select your preferred payment method</p>
              
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: method.id }))}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      formData.paymentMethod === method.id
                        ? "border-circleTel-orange bg-orange-50 text-circleTel-orange"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {method.icon}
                    <span className="text-xs font-semibold">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {formData.paymentMethod === "card" && (
                <motion.form
                  key="card-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                  onSubmit={handleSubmit}
                >
                  {/* Card Number */}
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      placeholder="4111 1111 1111 1111"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.cardNumber ? "border-destructive" : "border-border"
                      } bg-background focus:outline-none focus:ring-2 focus:ring-circleTel-orange`}
                    />
                    {errors.cardNumber && (
                      <p className="text-destructive text-sm mt-1">{errors.cardNumber}</p>
                    )}
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium mb-2">
                        Expiration
                      </label>
                      <select
                        value={formData.expiryMonth}
                        onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.expiryMonth ? "border-destructive" : "border-border"
                        } bg-background focus:outline-none focus:ring-2 focus:ring-circleTel-orange`}
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, "0");
                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="expiryYear" className="block text-sm font-medium mb-2">
                        Year
                      </label>
                      <select
                        value={formData.expiryYear}
                        onChange={(e) => handleInputChange("expiryYear", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.expiryMonth ? "border-destructive" : "border-border"
                        } bg-background focus:outline-none focus:ring-2 focus:ring-circleTel-orange`}
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = ((new Date().getFullYear() % 100) + i).toString().padStart(2, "0");
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* CVV Row */}
                  <div>
                    <label htmlFor="cvv" className="block text-sm font-medium mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange("cvv", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.cvv ? "border-destructive" : "border-border"
                      } bg-background focus:outline-none focus:ring-2 focus:ring-circleTel-orange`}
                    />
                    {errors.cvv && <p className="text-destructive text-sm mt-1">{errors.cvv}</p>}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label htmlFor="cardholderName" className="block text-sm font-medium mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      placeholder="John Doe"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.cardholderName ? "border-destructive" : "border-border"
                      } bg-background focus:outline-none focus:ring-2 focus:ring-circleTel-orange`}
                    />
                    {errors.cardholderName && (
                      <p className="text-destructive text-sm mt-1">{errors.cardholderName}</p>
                    )}
                  </div>
                </motion.form>
              )}

              {formData.paymentMethod === "digital-wallet" && (
                <motion.div
                  key="digital-wallet"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-8 text-center"
                >
                  <p className="text-muted-foreground">Digital wallet payment coming soon.</p>
                </motion.div>
              )}

              {formData.paymentMethod === "other" && (
                <motion.div
                  key="other"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-8 text-center"
                >
                  <p className="text-muted-foreground">Other payment methods coming soon.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Right Column - Order Summary */}
        <Card className="rounded-2xl border-2 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Order Summary</CardTitle>
            <p className="text-sm text-muted-foreground">Review your order details</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex justify-between text-foreground">
                <span>Subtotal</span>
                <span>R{orderSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Shipping
                </span>
                <span>R{orderSummary.shipping.toFixed(2)}</span>
              </div>
              {orderSummary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Discount
                  </span>
                  <span>-R{orderSummary.discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-circleTel-orange">
                  R{orderSummary.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">{orderSummary.items}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold">{orderSummary.delivery}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-6 rounded-lg transition-colors text-lg"
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Place Order
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By placing your order, you agree to our terms and conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
