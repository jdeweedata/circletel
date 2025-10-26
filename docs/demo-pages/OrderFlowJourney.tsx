"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Home,
  Building2,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  MapPin,
  Package,
  Shield,
  Zap,
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  TrendingUp,
  Smartphone,
  QrCode,
  Receipt,
  Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadGoogleMapsService } from '@/lib/googleMapsLoader';
import type { PlaceResult } from '@/services/googleMaps';

// ============================================================================
// TYPES
// ============================================================================

interface FormData {
  // Account Creation
  authMethod: "email" | "google";
  email: string;
  password: string;
  phone: string;
  acceptTerms: boolean;

  // Service Address
  serviceType: "residential" | "business";
  propertyType: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;

  // Payment
  paymentMethod: "card" | "instant-eft" | "capitec" | "bank-eft" | "scan-to-pay" | "payflex" | "1voucher" | "paymyway" | "scode";
  acceptPaymentTerms: boolean;

  // Card details (if card payment)
  cardNumber: string;
  cardExpiry: string;
  cardCVV: string;
  cardName: string;
}

interface Package {
  id: string;
  name: string;
  speed: string;
  monthlyPrice: number;
  installationFee: number;
  routerFee: number;
  features: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return cleaned;
}

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const OrderFlowJourney: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);

  // Refs for Google Places Autocomplete
  const streetInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [formData, setFormData] = useState<FormData>({
    // Account
    authMethod: "email",
    email: "",
    password: "",
    phone: "",
    acceptTerms: false,

    // Service Address
    serviceType: "residential",
    propertyType: "",
    street: "",
    suburb: "",
    city: "",
    province: "",
    postalCode: "",

    // Payment
    paymentMethod: "card",
    acceptPaymentTerms: false,
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    cardName: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Sample package data
  const selectedPackage: Package = {
    id: "fibre-100",
    name: "Fibre 100Mbps",
    speed: "100/100 Mbps",
    monthlyPrice: 799,
    installationFee: 0,
    routerFee: 0,
    features: [
      "100Mbps symmetrical speed",
      "Unlimited data",
      "Free installation",
      "Free Wi-Fi router",
      "24/7 support",
    ],
  };

  // Calculate order totals
  const subtotal = selectedPackage.monthlyPrice;
  const onceOffFees = selectedPackage.installationFee + selectedPackage.routerFee;
  const vat = (subtotal + onceOffFees) * 0.15;
  const total = subtotal + onceOffFees + vat;

  const tabs = [
    { id: 0, title: "Account", icon: <User className="w-4 h-4" /> },
    { id: 1, title: "Service Address", icon: <MapPin className="w-4 h-4" /> },
    { id: 2, title: "Payment", icon: <CreditCard className="w-4 h-4" /> },
    { id: 3, title: "Confirmation", icon: <Check className="w-4 h-4" /> },
  ];

  // SA Provinces
  const provinces = [
    "Gauteng",
    "Western Cape",
    "KwaZulu-Natal",
    "Eastern Cape",
    "Free State",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
  ];

  // Property types
  const residentialPropertyTypes = [
    { value: "freestanding_home", label: "Freestanding Home (SDU)" },
    { value: "gated_estate", label: "Gated Estate or Security Estate" },
    { value: "apartment_complex", label: "Apartment / Flat Complex" },
    { value: "townhouse", label: "Townhouse" },
  ];

  const businessPropertyTypes = [
    { value: "office_business_park", label: "Office or Business Park" },
    { value: "industrial_warehouse", label: "Industrial or Warehouse" },
    { value: "educational_facility", label: "Educational Facility" },
    { value: "healthcare_facility", label: "Healthcare Facility" },
    { value: "freestanding_building", label: "Free Standing Building" },
    { value: "soho", label: "Small Office Home Office (SOHO)" },
  ];

  const propertyTypes = formData.serviceType === "residential" ? residentialPropertyTypes : businessPropertyTypes;

  // Payment methods
  const paymentMethods = [
    { id: "card", icon: <CreditCard className="w-6 h-6" />, label: "Card Payment", description: "Visa, Mastercard, Amex", color: "orange" },
    { id: "instant-eft", icon: <Zap className="w-6 h-6" />, label: "Instant EFT", description: "Real-time via Ozow", color: "green" },
    { id: "capitec", icon: <Smartphone className="w-6 h-6" />, label: "Capitec Pay", description: "Fast Capitec payments", color: "blue" },
    { id: "bank-eft", icon: <Building2 className="w-6 h-6" />, label: "Bank EFT", description: "Online banking transfer", color: "purple" },
    { id: "scan-to-pay", icon: <QrCode className="w-6 h-6" />, label: "Scan to Pay", description: "SnapScan, Zapper", color: "orange" },
    { id: "payflex", icon: <Calendar className="w-6 h-6" />, label: "Payflex", description: "Buy now, pay later", color: "green" },
    { id: "1voucher", icon: <Receipt className="w-6 h-6" />, label: "1Voucher", description: "Cash vouchers", color: "blue" },
    { id: "paymyway", icon: <Store className="w-6 h-6" />, label: "paymyway", description: "Pay at 24k+ stores", color: "purple" },
    { id: "scode", icon: <Receipt className="w-6 h-6" />, label: "SCode Retail", description: "6k+ retail outlets", color: "orange" },
  ];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    let processedValue = value;

    if (typeof value === "string") {
      if (field === "phone") {
        processedValue = formatPhone(value);
      } else if (field === "cardNumber") {
        processedValue = formatCardNumber(value).slice(0, 19);
      } else if (field === "cardExpiry") {
        processedValue = formatExpiry(value);
      } else if (field === "cardCVV") {
        processedValue = value.replace(/\D/g, "").slice(0, 4);
      } else if (field === "postalCode") {
        processedValue = value.replace(/\D/g, "").slice(0, 4);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle Google Places Autocomplete selection
  const handlePlaceSelect = (place: PlaceResult) => {
    if (!place.address_components) return;

    let streetNumber = '';
    let route = '';
    let suburb = '';
    let locality = '';
    let province = '';
    let postalCode = '';

    place.address_components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        suburb = component.long_name;
      } else if (types.includes('locality')) {
        locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        province = component.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    // Build full street address
    const fullStreet = [streetNumber, route].filter(Boolean).join(' ');

    // Auto-fill form fields
    handleInputChange('street', fullStreet);
    handleInputChange('suburb', suburb || locality);
    handleInputChange('city', locality);
    handleInputChange('province', province);
    handleInputChange('postalCode', postalCode);
  };

  const validateTab = (tabIndex: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Tab 0: Account Creation
    if (tabIndex === 0) {
      if (formData.authMethod === "email") {
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Valid email required";
        }
        if (!formData.password || formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        }
        if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
          newErrors.phone = "Valid 10-digit phone number required";
        }
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = "You must accept the terms";
        }
      }
    }

    // Tab 1: Service Address
    if (tabIndex === 1) {
      if (!formData.propertyType) {
        newErrors.propertyType = "Property type required";
      }
      if (!formData.street.trim()) {
        newErrors.street = "Street address required";
      }
      if (!formData.suburb.trim()) {
        newErrors.suburb = "Suburb required";
      }
      if (!formData.city.trim()) {
        newErrors.city = "City required";
      }
      if (!formData.province) {
        newErrors.province = "Province required";
      }
      if (!formData.postalCode || formData.postalCode.length !== 4) {
        newErrors.postalCode = "Valid 4-digit postal code required";
      }
    }

    // Tab 2: Payment
    if (tabIndex === 2) {
      if (formData.paymentMethod === "card") {
        if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13) {
          newErrors.cardNumber = "Valid card number required";
        }
        if (!formData.cardExpiry || formData.cardExpiry.length < 5) {
          newErrors.cardExpiry = "Valid expiry date required (MM/YY)";
        }
        if (!formData.cardCVV || formData.cardCVV.length < 3) {
          newErrors.cardCVV = "Valid CVV required";
        }
        if (!formData.cardName.trim()) {
          newErrors.cardName = "Cardholder name required";
        }
      }
      if (!formData.acceptPaymentTerms) {
        newErrors.acceptPaymentTerms = "You must accept the terms";
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
    if (validateTab(activeTab)) {
      setActiveTab(3);
    }
  };

  const handleReset = () => {
    setActiveTab(0);
    setFormData({
      authMethod: "email",
      email: "",
      password: "",
      phone: "",
      acceptTerms: false,
      serviceType: "residential",
      propertyType: "",
      street: "",
      suburb: "",
      city: "",
      province: "",
      postalCode: "",
      paymentMethod: "card",
      acceptPaymentTerms: false,
      cardNumber: "",
      cardExpiry: "",
      cardCVV: "",
      cardName: "",
    });
    setErrors({});
  };

  // ============================================================================
  // GOOGLE PLACES AUTOCOMPLETE
  // ============================================================================

  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!streetInputRef.current) return;

      try {
        const googleMapsService = await loadGoogleMapsService();

        const autocomplete = await googleMapsService.initializeAutocomplete(
          streetInputRef.current,
          handlePlaceSelect
        );

        autocompleteRef.current = autocomplete;
        setAutocompleteError(null);
      } catch (error) {
        console.error('Failed to initialize autocomplete:', error);
        setAutocompleteError('Address autocomplete unavailable - manual entry enabled');
      }
    };

    // Only initialize on Tab 1 (Service Address)
    if (activeTab === 1) {
      initializeAutocomplete();
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current && window.google) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [activeTab]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CircleTel Order Journey</h1>
          <p className="text-slate-600">Complete your connectivity order in 3 simple steps</p>
        </div>

        {/* DEMO WARNING BANNER */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg border-2 border-blue-400 p-4 mb-6">
          <div className="flex items-center gap-3 text-white">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">⚡ DEMO MODE - Interactive Preview Only</p>
              <p className="text-sm text-blue-100">
                This is a demonstration of the order flow. No real orders will be created, no payments processed, and no data will be saved.
                <span className="font-semibold"> To place a real order, start from the homepage.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
          <div className="flex items-center justify-between">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => index <= activeTab && setActiveTab(index)}
                  disabled={index > activeTab}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                    activeTab === index
                      ? "bg-[#F5831F] text-white shadow-md"
                      : index < activeTab
                      ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {index < activeTab ? <Check className="w-4 h-4" /> : tab.icon}
                  <span className="hidden sm:inline text-sm font-medium">{tab.title}</span>
                  <span className="sm:hidden text-sm font-medium">{index + 1}</span>
                </button>
                {index < tabs.length - 1 && <ChevronRight className="w-5 h-5 text-slate-300 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* ================================================================ */}
            {/* TAB 0: ACCOUNT CREATION */}
            {/* ================================================================ */}
            {activeTab === 0 && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h2>
                <p className="text-slate-600 mb-6">Sign up to continue with your order</p>

                {/* Auth Method Toggle */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => handleInputChange("authMethod", "email")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      formData.authMethod === "email"
                        ? "border-[#F5831F] bg-orange-50 text-[#F5831F]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Mail className="w-5 h-5 inline mr-2" />
                    Email & Password
                  </button>
                  <button
                    onClick={() => handleInputChange("authMethod", "google")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      formData.authMethod === "google"
                        ? "border-[#F5831F] bg-orange-50 text-[#F5831F]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <svg className="w-5 h-5 inline mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                </div>

                {/* Email/Password Form */}
                {formData.authMethod === "email" && (
                  <div className="space-y-5">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.email ? "border-red-500 bg-red-50" : "border-slate-200"
                        } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">⚠ {errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border-2 ${
                            errors.password ? "border-red-500 bg-red-50" : "border-slate-200"
                          } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-600 text-sm mt-1">⚠ {errors.password}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="082 123 4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.phone ? "border-red-500 bg-red-50" : "border-slate-200"
                        } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                      />
                      {errors.phone && <p className="text-red-600 text-sm mt-1">⚠ {errors.phone}</p>}
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange("acceptTerms", e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#F5831F] border-slate-300 rounded focus:ring-[#F5831F]"
                      />
                      <label htmlFor="terms" className="text-sm text-slate-600">
                        I accept the{" "}
                        <a href="#" className="text-[#F5831F] hover:underline">
                          Terms & Conditions
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-[#F5831F] hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    {errors.acceptTerms && <p className="text-red-600 text-sm">⚠ {errors.acceptTerms}</p>}
                  </div>
                )}

                {/* Google OAuth - Redesigned with Amber-Minimal TweakCN Theme */}
                {formData.authMethod === "google" && (
                  <motion.div
                    className="py-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="max-w-lg mx-auto">
                      {/* Main Notification Card - Amber-Minimal Theme */}
                      <div className="relative bg-gradient-to-br from-amber-50/80 to-orange-50/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                        {/* Animated Accent Bar */}
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500"
                          initial={{ opacity: 0.6 }}
                          animate={{
                            opacity: [0.6, 1, 0.6],
                            scaleY: [0.98, 1, 0.98]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        <div className="pl-6 pr-5 py-6">
                          {/* Micro-heading */}
                          <p className="text-xs font-medium tracking-wide text-amber-700/80 uppercase mb-3 ml-1">
                            You're all set to join CircleTel
                          </p>

                          {/* Main Content with Google Icon */}
                          <div className="flex items-start gap-3.5 mb-4">
                            {/* Google Icon - Friendly & Simple */}
                            <div className="flex-shrink-0 mt-0.5">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>

                            {/* Conversational Message - Left-aligned, Natural Spacing */}
                            <div className="flex-1 pt-0.5">
                              <p className="text-[15px] leading-relaxed text-slate-800 font-normal">
                                You're almost there—tap <span className="font-medium text-slate-900">Continue</span> to sign in with Google.
                                <span className="block mt-1.5 text-amber-800/90">
                                  No email wait, just instant access!
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Minimal Benefits - Relaxed Spacing */}
                          <div className="ml-9 space-y-2 mt-5 mb-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                              <span className="font-normal">No password needed</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                              <span className="font-normal">Already verified</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                              <span className="font-normal">OAuth 2.0 secure</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* TAB 1: SERVICE ADDRESS */}
            {/* ================================================================ */}
            {activeTab === 1 && (
              <motion.div
                key="service-address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Service Address</h2>
                <p className="text-slate-600 mb-6">Where should we deliver your connectivity service?</p>

                {/* Service Type Toggle */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => {
                      handleInputChange("serviceType", "residential");
                      handleInputChange("propertyType", "");
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      formData.serviceType === "residential"
                        ? "border-[#F5831F] bg-orange-50 text-[#F5831F]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Home className="w-5 h-5 inline mr-2" />
                    Residential
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange("serviceType", "business");
                      handleInputChange("propertyType", "");
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      formData.serviceType === "business"
                        ? "border-[#F5831F] bg-orange-50 text-[#F5831F]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Building2 className="w-5 h-5 inline mr-2" />
                    Business
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Property Type
                    </label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => handleInputChange("propertyType", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.propertyType ? "border-red-500 bg-red-50" : "border-slate-200"
                      } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                    >
                      <option value="">Select property type...</option>
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.propertyType && <p className="text-red-600 text-sm mt-1">⚠ {errors.propertyType}</p>}
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Street Address
                    </label>
                    <input
                      ref={streetInputRef}
                      type="text"
                      placeholder="Start typing your address..."
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.street ? "border-red-500 bg-red-50" : "border-slate-200"
                      } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                    />
                    {errors.street && <p className="text-red-600 text-sm mt-1">⚠ {errors.street}</p>}
                    {!errors.street && autocompleteError && (
                      <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {autocompleteError}
                      </p>
                    )}
                    {!errors.street && !autocompleteError && (
                      <p className="text-slate-500 text-xs mt-1">
                        Start typing for address suggestions (powered by Google Places)
                      </p>
                    )}
                  </div>

                  {/* Suburb & City */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Suburb
                      </label>
                      <input
                        type="text"
                        placeholder="Sandton"
                        value={formData.suburb}
                        onChange={(e) => handleInputChange("suburb", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.suburb ? "border-red-500 bg-red-50" : "border-slate-200"
                        } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                      />
                      {errors.suburb && <p className="text-red-600 text-sm mt-1">⚠ {errors.suburb}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="Johannesburg"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.city ? "border-red-500 bg-red-50" : "border-slate-200"
                        } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                      />
                      {errors.city && <p className="text-red-600 text-sm mt-1">⚠ {errors.city}</p>}
                    </div>
                  </div>

                  {/* Province & Postal Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Province
                      </label>
                      <select
                        value={formData.province}
                        onChange={(e) => handleInputChange("province", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.province ? "border-red-500 bg-red-50" : "border-slate-200"
                        } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                      >
                        <option value="">Select province...</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                      {errors.province && <p className="text-red-600 text-sm mt-1">⚠ {errors.province}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="2196"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.postalCode ? "border-red-500 bg-red-50" : "border-slate-200"
                        } focus:outline-none focus:ring-2 focus:ring-[#F5831F] focus:border-transparent`}
                      />
                      {errors.postalCode && <p className="text-red-600 text-sm mt-1">⚠ {errors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* TAB 2: PAYMENT */}
            {/* ================================================================ */}
            {activeTab === 2 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-3 gap-6 p-8"
              >
                {/* Left Column: Order Summary (1/3) */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Package Card */}
                  <div className="bg-gradient-to-br from-[#F5831F] to-[#e67516] text-white rounded-lg p-5 shadow-md">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedPackage.name}</h3>
                        <p className="text-sm opacity-90">{selectedPackage.speed}</p>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {selectedPackage.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Installation Address */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#F5831F]" />
                      Installation Address
                    </h3>
                    <p className="text-sm text-slate-700">
                      {formData.street}
                      <br />
                      {formData.suburb}, {formData.city}
                      <br />
                      {formData.province} {formData.postalCode}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Monthly</span>
                        <span className="font-medium">R {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Installation</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Router</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">VAT (15%)</span>
                        <span className="font-medium">R {vat.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-300 pt-2 flex justify-between">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="font-bold text-[#F5831F] text-lg">R {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Payment Methods (2/3) */}
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose Payment Method</h2>
                  <p className="text-slate-600 mb-6">Select how you'd like to pay</p>

                  {/* Payment Method Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleInputChange("paymentMethod", method.id)}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                          formData.paymentMethod === method.id
                            ? "border-[#F5831F] bg-orange-50 shadow-md"
                            : "border-slate-200 hover:border-orange-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.paymentMethod === method.id
                              ? "bg-[#F5831F] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-sm">{method.label}</h3>
                          <p className="text-xs text-slate-600">{method.description}</p>
                        </div>
                        {formData.paymentMethod === method.id && (
                          <Check className="w-5 h-5 text-[#F5831F]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Card Form (if card selected) */}
                  {formData.paymentMethod === "card" && (
                    <div className="bg-slate-50 rounded-lg p-5 mb-6 space-y-4">
                      <h3 className="font-semibold text-slate-900">Card Details</h3>
                      <div>
                        <input
                          type="text"
                          placeholder="Card Number"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border-2 ${
                            errors.cardNumber ? "border-red-500 bg-red-50" : "border-slate-200"
                          } focus:outline-none focus:ring-2 focus:ring-[#F5831F]`}
                        />
                        {errors.cardNumber && <p className="text-red-600 text-sm mt-1">⚠ {errors.cardNumber}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange("cardExpiry", e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border-2 ${
                              errors.cardExpiry ? "border-red-500 bg-red-50" : "border-slate-200"
                            } focus:outline-none focus:ring-2 focus:ring-[#F5831F]`}
                          />
                          {errors.cardExpiry && <p className="text-red-600 text-sm mt-1">⚠ {errors.cardExpiry}</p>}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="CVV"
                            value={formData.cardCVV}
                            onChange={(e) => handleInputChange("cardCVV", e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border-2 ${
                              errors.cardCVV ? "border-red-500 bg-red-50" : "border-slate-200"
                            } focus:outline-none focus:ring-2 focus:ring-[#F5831F]`}
                          />
                          {errors.cardCVV && <p className="text-red-600 text-sm mt-1">⚠ {errors.cardCVV}</p>}
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Cardholder Name"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange("cardName", e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border-2 ${
                            errors.cardName ? "border-red-500 bg-red-50" : "border-slate-200"
                          } focus:outline-none focus:ring-2 focus:ring-[#F5831F]`}
                        />
                        {errors.cardName && <p className="text-red-600 text-sm mt-1">⚠ {errors.cardName}</p>}
                      </div>
                    </div>
                  )}

                  {/* Security Features */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                      <Lock className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-green-900">256-bit SSL</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                      <Shield className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-blue-900">PCI DSS</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                      <Check className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-purple-900">Verified</p>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="paymentTerms"
                      checked={formData.acceptPaymentTerms}
                      onChange={(e) => handleInputChange("acceptPaymentTerms", e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#F5831F] border-slate-300 rounded focus:ring-[#F5831F]"
                    />
                    <label htmlFor="paymentTerms" className="text-sm text-slate-600">
                      I agree to the Terms & Conditions and authorize CircleTel to charge my payment method
                    </label>
                  </div>
                  {errors.acceptPaymentTerms && (
                    <p className="text-red-600 text-sm mt-1">⚠ {errors.acceptPaymentTerms}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================================================================ */}
            {/* TAB 3: CONFIRMATION */}
            {/* ================================================================ */}
            {activeTab === 3 && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="p-12 text-center"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Order Confirmed!</h2>
                <p className="text-slate-600 mb-2">
                  Thank you for choosing CircleTel. Your connectivity order has been successfully placed.
                </p>
                <p className="text-sm text-slate-500 mb-8">
                  You'll receive a confirmation email at <strong>{formData.email || "your email"}</strong>
                </p>

                {/* Order Details Card */}
                <div className="bg-slate-50 rounded-lg p-6 mb-8 max-w-lg mx-auto">
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Number:</span>
                      <span className="font-semibold text-slate-900">
                        #ORD-{Date.now().toString().slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Package:</span>
                      <span className="font-semibold text-slate-900">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Monthly Cost:</span>
                      <span className="font-semibold text-slate-900">
                        R {selectedPackage.monthlyPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Installation Address:</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {formData.street}, {formData.suburb}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment Method:</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {formData.paymentMethod.replace("-", " ")}
                      </span>
                    </div>
                    <div className="border-t border-slate-300 pt-3 flex justify-between">
                      <span className="text-slate-600">Total Paid:</span>
                      <span className="font-bold text-[#F5831F] text-xl">R {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 rounded-lg p-5 mb-8 max-w-lg mx-auto border border-blue-200 text-left">
                  <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
                  <ol className="space-y-2 text-sm text-blue-900 list-decimal ml-5">
                    <li>You'll receive an order confirmation email within 5 minutes</li>
                    <li>Our team will contact you within 24 hours to schedule installation</li>
                    <li>Installation typically occurs within 3-5 business days</li>
                    <li>Our technician will set up your equipment and ensure everything works</li>
                    <li>You'll be online and enjoying fast, reliable connectivity!</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-[#F5831F] hover:bg-[#e67516] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Place Another Order
                  </button>
                  <button className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                    View Dashboard
                  </button>
                </div>
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
                className="px-6 py-3 bg-[#F5831F] hover:bg-[#e67516] text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-[#F5831F] hover:bg-[#e67516] text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Shield className="w-5 h-5" />
                Complete Secure Payment
              </button>
            )}
          </div>
        )}

        {/* Footer Badge */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500 mb-2">Powered by</p>
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 bg-[#F5831F] text-white text-sm font-bold rounded">
              CIRCLETEL
            </div>
            <span className="text-xs text-slate-400">Enterprise Connectivity Solutions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFlowJourney;
