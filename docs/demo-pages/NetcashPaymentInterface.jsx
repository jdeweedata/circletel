"use client";

import * as React from "react";
import { useState } from "react";
import { CreditCard, Package, Truck, Tag, Check, ChevronRight, ChevronLeft, Building2, Zap, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface FormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  paymentMethod: "card" | "instant-eft" | "bank-eft";
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  deliveryDate: string;
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

// Main Component
const NetcashPaymentInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    paymentMethod: "card",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const orderSummary: OrderSummary = {
    items: [
      { id: "1", name: "Premium Wireless Headphones", quantity: 1, price: 299.99 },
      { id: "2", name: "USB-C Cable (2m)", quantity: 2, price: 19.99 },
    ],
    subtotal: 339.97,
    shipping: 15.0,
    discount: 34.0,
    total: 320.97,
    deliveryDate: "Dec 28, 2024",
  };

  // Banking details for Bank EFT
  const bankingDetails = {
    accountName: "Your Company Name (Pty) Ltd",
    bank: "First National Bank",
    accountNumber: "62XXXXXXXXXX",
    branchCode: "250655",
    accountType: "Current/Cheque Account",
    reference: `ORD${Date.now().toString().slice(-8)}`,
    amount: orderSummary.total.toFixed(2),
  };

  const tabs = [
    { id: 0, title: "Payment Method", icon: <CreditCard className="w-4 h-4" /> },
    { id: 1, title: "Payment Details", icon: <CreditCard className="w-4 h-4" /> },
    { id: 2, title: "Review Order", icon: <Package className="w-4 h-4" /> },
    { id: 3, title: "Complete", icon: <Check className="w-4 h-4" /> },
  ];

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

  const validateTab = (tabIndex: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (tabIndex === 0) {
      return true;
    }

    if (tabIndex === 1 && formData.paymentMethod === "card") {
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

  const handleNext = () => {
    if (validateTab(activeTab)) {
      if (activeTab < tabs.length - 1) {
        setActiveTab(activeTab + 1);
      }
    }
  };

  const handleBack = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleSubmit = () => {
    if (validateTab(1)) {
      setActiveTab(3);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const paymentMethods = [
    {
      id: "card" as const,
      icon: <CreditCard className="w-6 h-6" />,
      label: "Credit/Debit Card",
      description: "Visa, Mastercard, Amex, Diners",
      badge: "3D Secure",
    },
    {
      id: "instant-eft" as const,
      icon: <Zap className="w-6 h-6" />,
      label: "Instant EFT",
      description: "Pay instantly via Ozow",
      badge: "No Chargebacks",
    },
    {
      id: "bank-eft" as const,
      icon: <Building2 className="w-6 h-6" />,
      label: "Bank Transfer",
      description: "Manual bank transfer (EFT)",
      badge: "Secure",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Secure Checkout</h1>
          <p className="text-slate-600">Complete your purchase securely with Netcash</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
          <div className="flex items-center justify-between">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => index <= activeTab && setActiveTab(index)}
                  disabled={index > activeTab}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                    activeTab === index
                      ? "bg-emerald-500 text-white shadow-md"
                      : index < activeTab
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {index < activeTab ? <Check className="w-4 h-4" /> : tab.icon}
                  <span className="hidden sm:inline text-sm font-medium">{tab.title}</span>
                  <span className="sm:hidden text-sm font-medium">{index + 1}</span>
                </button>
                {index < tabs.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-300 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <AnimatePresence mode="wait">
            {/* Tab 0: Payment Method Selection */}
            {activeTab === 0 && (
              <motion.div
                key="payment-method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Choose Your Payment Method
                </h2>
                <p className="text-slate-600 mb-6">
                  Select how you'd like to pay for your order
                </p>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, paymentMethod: method.id }));
                      }}
                      className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                        formData.paymentMethod === method.id
                          ? "border-emerald-500 bg-emerald-50 shadow-md"
                          : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                          formData.paymentMethod === method.id
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{method.label}</h3>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {method.badge}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{method.description}</p>
                      </div>
                      {formData.paymentMethod === method.id && (
                        <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab 1: Payment Details */}
            {activeTab === 1 && (
              <motion.div
                key="payment-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {formData.paymentMethod === "card" && "Enter Card Details"}
                  {formData.paymentMethod === "instant-eft" && "Instant EFT Payment"}
                  {formData.paymentMethod === "bank-eft" && "Bank Transfer Details"}
                </h2>
                <p className="text-slate-600 mb-6">
                  {formData.paymentMethod === "card" &&
                    "Your payment information is encrypted and secure"}
                  {formData.paymentMethod === "instant-eft" &&
                    "You'll be redirected to Ozow to complete your payment"}
                  {formData.paymentMethod === "bank-eft" &&
                    "Please transfer the exact amount to the following account"}
                </p>

                {/* Credit/Debit Card Form */}
                {formData.paymentMethod === "card" && (
                  <div className="space-y-5">
                    {/* Card Number */}
                    <div>
                      <label
                        htmlFor="cardNumber"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                      >
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.cardNumber
                            ? "border-red-500 bg-red-50"
                            : "border-slate-200 bg-white"
                        } text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <span>⚠</span> {errors.cardNumber}
                        </p>
                      )}
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="expiry"
                          className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                          Expiration Date
                        </label>
                        <input
                          type="text"
                          id="expiry"
                          placeholder="MM/YY"
                          value={
                            formData.expiryMonth && formData.expiryYear
                              ? `${formData.expiryMonth}/${formData.expiryYear}`
                              : formData.expiryMonth
                          }
                          onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border-2 ${
                            errors.expiryMonth
                              ? "border-red-500 bg-red-50"
                              : "border-slate-200 bg-white"
                          } text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                        />
                        {errors.expiryMonth && (
                          <p className="text-red-600 text-sm mt-1">⚠ {errors.expiryMonth}</p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="cvv"
                          className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                          CVV
                        </label>
                        <input
                          type="text"
                          id="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange("cvv", e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border-2 ${
                            errors.cvv ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"
                          } text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                        />
                        {errors.cvv && (
                          <p className="text-red-600 text-sm mt-1">⚠ {errors.cvv}</p>
                        )}
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label
                        htmlFor="cardholderName"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                      >
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        id="cardholderName"
                        placeholder="John Doe"
                        value={formData.cardholderName}
                        onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.cardholderName
                            ? "border-red-500 bg-red-50"
                            : "border-slate-200 bg-white"
                        } text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                      />
                      {errors.cardholderName && (
                        <p className="text-red-600 text-sm mt-1">⚠ {errors.cardholderName}</p>
                      )}
                    </div>

                    {/* Supported Cards */}
                    <div className="flex items-center gap-3 pt-2">
                      <p className="text-sm text-slate-600">We accept:</p>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-700">
                          VISA
                        </div>
                        <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-700">
                          MC
                        </div>
                        <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-700">
                          AMEX
                        </div>
                        <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-700">
                          DC
                        </div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-emerald-50 rounded-lg p-4 flex items-center gap-3 border border-emerald-200">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          3D Secure Payment Protected
                        </p>
                        <p className="text-xs text-emerald-700">
                          256-bit SSL encryption · PCI DSS Level 1 Compliant
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instant EFT (Ozow) */}
                {formData.paymentMethod === "instant-eft" && (
                  <div className="py-8">
                    <div className="max-w-md mx-auto">
                      {/* Ozow Logo/Badge */}
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Zap className="w-10 h-10 text-white" />
                      </div>

                      <div className="text-center mb-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          Pay with Ozow Instant EFT
                        </h3>
                        <p className="text-slate-600">
                          Fast, secure payment directly from your bank account
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-slate-700">Instant payment confirmation</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-slate-700">No chargebacks - secure payment</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-slate-700">All major SA banks supported</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-slate-700">No credit card required</span>
                        </div>
                      </div>

                      {/* Supported Banks */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-3 text-center">
                          SUPPORTED BANKS
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {["FNB", "Standard Bank", "ABSA", "Nedbank", "Capitec", "RMB"].map(
                            (bank) => (
                              <div
                                key={bank}
                                className="text-xs font-medium text-slate-600 bg-white rounded py-2 px-1"
                              >
                                {bank}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                          Click "Continue to Review" to proceed to Ozow where you'll select your
                          bank and complete payment securely.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank EFT Details */}
                {formData.paymentMethod === "bank-eft" && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          Important: Use the exact reference number
                        </p>
                        <p className="text-sm text-amber-800">
                          Your payment will be automatically matched using your unique reference.
                          Processing may take 1-3 business days.
                        </p>
                      </div>
                    </div>

                    {/* Banking Details Card */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">Bank Transfer Details</h3>
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>

                      <div className="space-y-4">
                        {/* Account Name */}
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Account Name</p>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{bankingDetails.accountName}</p>
                            <button
                              onClick={() =>
                                copyToClipboard(bankingDetails.accountName, "accountName")
                              }
                              className="p-2 hover:bg-slate-700 rounded transition-colors"
                            >
                              {copiedField === "accountName" ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Bank */}
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Bank</p>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">{bankingDetails.bank}</p>
                            </div>
                          </div>

                          {/* Account Type */}
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Account Type</p>
                            <p className="font-semibold text-sm">{bankingDetails.accountType}</p>
                          </div>
                        </div>

                        {/* Account Number */}
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Account Number</p>
                          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                            <p className="font-mono text-lg font-bold tracking-wider">
                              {bankingDetails.accountNumber}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(bankingDetails.accountNumber, "accountNumber")
                              }
                              className="p-2 hover:bg-slate-600 rounded transition-colors"
                            >
                              {copiedField === "accountNumber" ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Branch Code */}
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Branch Code</p>
                          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                            <p className="font-mono text-lg font-bold tracking-wider">
                              {bankingDetails.branchCode}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(bankingDetails.branchCode, "branchCode")
                              }
                              className="p-2 hover:bg-slate-600 rounded transition-colors"
                            >
                              {copiedField === "branchCode" ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Reference - Highlighted */}
                        <div className="bg-emerald-600 rounded-lg p-4 border-2 border-emerald-400">
                          <p className="text-xs text-emerald-100 mb-1 font-semibold">
                            PAYMENT REFERENCE (REQUIRED)
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-xl font-bold tracking-wider">
                              {bankingDetails.reference}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(bankingDetails.reference, "reference")
                              }
                              className="p-2 bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                            >
                              {copiedField === "reference" ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <Copy className="w-4 h-4 text-white" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Amount */}
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Amount to Transfer</p>
                          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                            <p className="text-2xl font-bold text-emerald-400">
                              R {bankingDetails.amount}
                            </p>
                            <button
                              onClick={() => copyToClipboard(bankingDetails.amount, "amount")}
                              className="p-2 hover:bg-slate-600 rounded transition-colors"
                            >
                              {copiedField === "amount" ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Payment Instructions
                      </h4>
                      <ol className="text-sm text-blue-900 space-y-2 ml-7 list-decimal">
                        <li>Log in to your online banking or visit your bank</li>
                        <li>Add the beneficiary using the details above</li>
                        <li>
                          Enter the <strong>exact reference number</strong> provided
                        </li>
                        <li>Transfer the exact amount shown</li>
                        <li>We'll notify you once payment is received (1-3 business days)</li>
                      </ol>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 2: Review Order */}
            {activeTab === 2 && (
              <motion.div
                key="review-order"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Order</h2>
                <p className="text-slate-600 mb-6">
                  Please review your order details before completing your purchase
                </p>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-slate-900">Order Items</h3>
                  {orderSummary.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-900">R {item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Payment Method Summary */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Payment Method</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      {formData.paymentMethod === "card" && (
                        <CreditCard className="w-5 h-5 text-slate-600" />
                      )}
                      {formData.paymentMethod === "instant-eft" && (
                        <Zap className="w-5 h-5 text-slate-600" />
                      )}
                      {formData.paymentMethod === "bank-eft" && (
                        <Building2 className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {formData.paymentMethod === "card" && "Credit/Debit Card"}
                        {formData.paymentMethod === "instant-eft" && "Instant EFT (Ozow)"}
                        {formData.paymentMethod === "bank-eft" && "Bank Transfer (EFT)"}
                      </p>
                      {formData.paymentMethod === "card" && formData.cardNumber && (
                        <p className="text-sm text-slate-600">•••• {formData.cardNumber.slice(-4)}</p>
                      )}
                      {formData.paymentMethod === "bank-eft" && (
                        <p className="text-sm text-slate-600">
                          Reference: {bankingDetails.reference}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="border-t border-slate-200 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span>R {orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <span>R {orderSummary.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Discount
                    </span>
                    <span>-R {orderSummary.discount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      R {orderSummary.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Estimated Delivery</p>
                      <p className="text-sm text-slate-600">{orderSummary.deliveryDate}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Complete */}
            {activeTab === 3 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  {formData.paymentMethod === "bank-eft"
                    ? "Order Received!"
                    : "Order Placed Successfully!"}
                </h2>
                <p className="text-slate-600 mb-2">
                  {formData.paymentMethod === "bank-eft"
                    ? "Please complete the bank transfer to confirm your order."
                    : "Thank you for your purchase. Your order is being processed."}
                </p>
                <p className="text-sm text-slate-500 mb-8">
                  You'll receive a confirmation email shortly.
                </p>

                <div className="bg-slate-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Number:</span>
                      <span className="font-semibold text-slate-900">
                        #ORD-{Date.now().toString().slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Amount:</span>
                      <span className="font-semibold text-slate-900">
                        R {orderSummary.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment Method:</span>
                      <span className="font-semibold text-slate-900">
                        {formData.paymentMethod === "card" && "Card"}
                        {formData.paymentMethod === "instant-eft" && "Instant EFT"}
                        {formData.paymentMethod === "bank-eft" && "Bank Transfer"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Estimated Delivery:</span>
                      <span className="font-semibold text-slate-900">
                        {orderSummary.deliveryDate}
                      </span>
                    </div>
                  </div>
                </div>

                {formData.paymentMethod === "bank-eft" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <p className="text-sm text-amber-900 font-semibold mb-1">
                      ⏳ Awaiting Payment
                    </p>
                    <p className="text-sm text-amber-800">
                      Your order will be confirmed once we receive your bank transfer. Please use
                      reference: <strong>{bankingDetails.reference}</strong>
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setActiveTab(0);
                    setFormData({
                      cardNumber: "",
                      expiryMonth: "",
                      expiryYear: "",
                      cvv: "",
                      cardholderName: "",
                      paymentMethod: "card",
                    });
                  }}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Place Another Order
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {activeTab < 3 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={activeTab === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {activeTab < 2 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Check className="w-5 h-5" />
                {formData.paymentMethod === "bank-eft" ? "Confirm Order" : "Complete Payment"}
              </button>
            )}
          </div>
        )}

        {/* Terms */}
        {activeTab === 2 && (
          <p className="text-xs text-slate-500 text-center mt-4">
            By completing your order, you agree to our terms and conditions. All transactions are
            processed securely through Netcash PayNow.
          </p>
        )}

        {/* Netcash Badge */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500 mb-2">Secured by</p>
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 bg-slate-800 text-white text-sm font-bold rounded">
              NETCASH
            </div>
            <span className="text-xs text-slate-400">PCI DSS Level 1 Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetcashPaymentInterface;
