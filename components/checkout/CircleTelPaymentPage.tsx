"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOrderContext } from "@/components/order/context/OrderContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Lock,
  ShieldCheck,
  ChevronDown,
  Info,
  CheckCircle,
} from "lucide-react"

interface PaymentPageProps {
  variant?: "wireless" | "home-internet" | "business"
}

export function CircleTelPaymentPage({ variant = "home-internet" }: PaymentPageProps) {
  const router = useRouter()
  const { state } = useOrderContext()
  const selectedPackage = state.orderData.coverage?.selectedPackage
  const pricing = state.orderData.coverage?.pricing

  const [formData, setFormData] = useState({
    // Your Details
    idType: "sa-id",
    idNumber: "",
    alternateContact: "",

    // Service Address
    addressType: "house",
    streetNumber: "",
    streetName: "",
    suburb: state.orderData.coverage?.address?.split(",")[1]?.trim() || "",
    city: "",
    province: "",
    postalCode: "",

    // Delivery Address
    deliveryOption: "same",
    deliveryStreetNumber: "",
    deliveryStreetName: "",
    deliverySuburb: "",
    deliveryCity: "",
    deliveryProvince: "",
    deliveryPostalCode: "",

    // Payment Details
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    acceptMandate: false,
    acceptTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // ID Number validation
    if (!formData.idNumber) {
      newErrors.idNumber = "ID/Passport number is required"
    } else if (formData.idType === "sa-id" && formData.idNumber.length !== 13) {
      newErrors.idNumber = "SA ID must be 13 digits"
    }

    // Address validation
    if (!formData.streetNumber) newErrors.streetNumber = "Street number is required"
    if (!formData.streetName) newErrors.streetName = "Street name is required"
    if (!formData.postalCode) newErrors.postalCode = "Postal code is required"

    // Payment validation
    if (!formData.bankName) newErrors.bankName = "Bank name is required"
    if (!formData.accountHolderName) newErrors.accountHolderName = "Account holder name is required"
    if (!formData.accountNumber) newErrors.accountNumber = "Account number is required"
    if (!formData.accountType) newErrors.accountType = "Account type is required"
    if (!formData.acceptMandate) newErrors.acceptMandate = "You must accept the debit order mandate"
    if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      // Create order in database
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage?.id,
          customerDetails: formData,
          pricing: pricing,
        }),
      })

      if (!orderResponse.ok) throw new Error("Failed to create order")

      const { orderId } = await orderResponse.json()

      // Initiate payment
      const paymentResponse = await fetch("/api/payment/netcash/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: (pricing?.monthly || 0) + (pricing?.onceOff || 0),
        }),
      })

      if (!paymentResponse.ok) throw new Error("Failed to initiate payment")

      const { paymentUrl } = await paymentResponse.json()

      // Redirect to payment gateway
      window.location.href = paymentUrl
    } catch (error) {
      console.error("Payment error:", error)
      alert("Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0
  const installationFee = pricing?.onceOff || 0
  const totalAmount = basePrice + installationFee

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Progress */}
      <div className="bg-circleTel-orange text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">CircleTel</div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Secure Checkout</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Create Account</span>
            </div>
            <div className="w-12 h-0.5 bg-white/30"></div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <div className="w-5 h-5 bg-white text-circleTel-orange rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <span className="text-sm font-semibold">Payment</span>
            </div>
            <div className="w-12 h-0.5 bg-white/30"></div>
            <div className="flex items-center gap-2 text-white/60">
              <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
              <span className="text-sm">Order Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Step 2</p>
          <h1 className="text-3xl font-bold text-gray-900">Complete your order details</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your Details Section */}
          <Accordion type="single" collapsible defaultValue="details" className="bg-white rounded-lg shadow-sm">
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-start text-left">
                  <h3 className="text-xl font-semibold text-circleTel-orange">Your Details</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idType">
                        ID Type <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.idType} onValueChange={(value) => handleInputChange("idType", value)}>
                        <SelectTrigger id="idType">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sa-id">SA ID</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="company-reg">Company Registration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber">
                        ID / Passport Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => handleInputChange("idNumber", e.target.value)}
                        className={errors.idNumber ? "border-red-500" : ""}
                      />
                      {errors.idNumber && <p className="text-sm text-red-500">{errors.idNumber}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternateContact">Alternate Contact Number (Optional)</Label>
                    <Input
                      id="alternateContact"
                      value={formData.alternateContact}
                      onChange={(e) => handleInputChange("alternateContact", e.target.value)}
                      placeholder="e.g., 082 123 4567"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Service Address Section */}
          <Accordion type="single" collapsible defaultValue="address" className="bg-white rounded-lg shadow-sm">
            <AccordionItem value="address" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-xl font-semibold text-circleTel-orange">Service Address</h3>
                  <p className="text-sm text-gray-500 mt-1">This is the address we will use for your account.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressType">
                      Address Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.addressType} onValueChange={(value) => handleInputChange("addressType", value)}>
                      <SelectTrigger id="addressType">
                        <SelectValue placeholder="Select address type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">Free standing house</SelectItem>
                        <SelectItem value="apartment">Apartment / Flat</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="estate">Estate / Complex</SelectItem>
                        <SelectItem value="business">Business Premises</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetNumber">
                        Street Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="streetNumber"
                        value={formData.streetNumber}
                        onChange={(e) => handleInputChange("streetNumber", e.target.value)}
                        className={errors.streetNumber ? "border-red-500" : ""}
                      />
                      {errors.streetNumber && <p className="text-sm text-red-500">{errors.streetNumber}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="streetName">
                        Street Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="streetName"
                        value={formData.streetName}
                        onChange={(e) => handleInputChange("streetName", e.target.value)}
                        className={errors.streetName ? "border-red-500" : ""}
                      />
                      {errors.streetName && <p className="text-sm text-red-500">{errors.streetName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="suburb">
                        Suburb <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="suburb"
                        value={formData.suburb}
                        onChange={(e) => handleInputChange("suburb", e.target.value)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">
                        Province <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.province} onValueChange={(value) => handleInputChange("province", value)} disabled>
                        <SelectTrigger id="province" className="bg-gray-50">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gauteng">Gauteng</SelectItem>
                          <SelectItem value="western-cape">Western Cape</SelectItem>
                          <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">
                        Postal Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className={errors.postalCode ? "border-red-500" : ""}
                        maxLength={4}
                      />
                      {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Delivery Address Section */}
          <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm">
            <AccordionItem value="delivery" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-xl font-semibold text-circleTel-orange">Delivery Address</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Delivery of routers, SIM cards or other hardware takes place from Monday to Friday from 8am to 5pm.
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <RadioGroup value={formData.deliveryOption} onValueChange={(value) => handleInputChange("deliveryOption", value)}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="same" id="delivery-same" />
                    <Label htmlFor="delivery-same" className="cursor-pointer">
                      Same as address above
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="different" id="delivery-different" />
                    <Label htmlFor="delivery-different" className="cursor-pointer">
                      New delivery address
                    </Label>
                  </div>
                </RadioGroup>

                {formData.deliveryOption === "different" && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                    {/* Add delivery address fields here */}
                    <p className="text-sm text-gray-500">Delivery address fields would go here...</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Payment Details Section */}
          <Accordion type="single" collapsible defaultValue="payment" className="bg-white rounded-lg shadow-sm">
            <AccordionItem value="payment" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-xl font-semibold text-circleTel-orange">Payment Details</h3>
                  <p className="text-sm text-gray-500 mt-1">Your payment details will be stored securely and won't be shared.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">
                      Bank Name <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.bankName} onValueChange={(value) => handleInputChange("bankName", value)}>
                      <SelectTrigger id="bankName" className={errors.bankName ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="absa">ABSA</SelectItem>
                        <SelectItem value="fnb">FNB</SelectItem>
                        <SelectItem value="standard">Standard Bank</SelectItem>
                        <SelectItem value="nedbank">Nedbank</SelectItem>
                        <SelectItem value="capitec">Capitec</SelectItem>
                        <SelectItem value="investec">Investec</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.bankName && <p className="text-sm text-red-500">{errors.bankName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">
                      Account Holder Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                      className={errors.accountHolderName ? "border-red-500" : ""}
                    />
                    {errors.accountHolderName && <p className="text-sm text-red-500">{errors.accountHolderName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">
                      Account Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      className={errors.accountNumber ? "border-red-500" : ""}
                    />
                    {errors.accountNumber && <p className="text-sm text-red-500">{errors.accountNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">
                      Account Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.accountType} onValueChange={(value) => handleInputChange("accountType", value)}>
                      <SelectTrigger id="accountType" className={errors.accountType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cheque">Cheque Account</SelectItem>
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="transmission">Transmission Account</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.accountType && <p className="text-sm text-red-500">{errors.accountType}</p>}
                  </div>

                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-4">
                      All banks require service providers to authenticate from their customers to debit their accounts. Please fill out the form above and accept our short and sweet terms and conditions.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      This signed Authority and Mandate refers to our contract dated ("the Agreement"). I/We hereby authorise you to issue and deliver payment instructions to your Banker for collection against my/our above-mentioned account at my/our above-mentioned Bank (or any other bank or branch to which I/we may transfer my/our account) on condition that the sum of such payment instructions will never exceed my/our obligations as agreed to in the Agreement and commencing on {new Date().toLocaleDateString()} and continuing until this Authority and Mandate is terminated by me/us by giving you notice in writing of not less than 20 ordinary working days.
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptMandate"
                      checked={formData.acceptMandate}
                      onCheckedChange={(checked) => handleInputChange("acceptMandate", checked)}
                      className={errors.acceptMandate ? "border-red-500" : ""}
                    />
                    <Label htmlFor="acceptMandate" className="text-sm cursor-pointer">
                      I accept these debit order mandate terms and conditions
                    </Label>
                  </div>
                  {errors.acceptMandate && <p className="text-sm text-red-500">{errors.acceptMandate}</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Order Summary Section */}
          <Accordion type="single" collapsible defaultValue="summary" className="bg-white rounded-lg shadow-sm">
            <AccordionItem value="summary" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h3 className="text-xl font-semibold text-circleTel-orange">Order Summary</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  {/* Package */}
                  <div className="pb-4 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{selectedPackage?.name || "Package"}</p>
                        <p className="text-sm text-gray-500">Payment Terms: Monthly</p>
                      </div>
                      <p className="font-bold text-circleTel-orange">R{basePrice}/pm</p>
                    </div>
                    {selectedPackage?.speed && (
                      <p className="text-sm text-gray-600">{selectedPackage.speed}</p>
                    )}
                  </div>

                  {/* Router */}
                  <div className="flex justify-between items-center pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">Free to use Router</p>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="font-semibold text-green-600">FREE</p>
                  </div>

                  {/* Installation Fee */}
                  {installationFee > 0 && (
                    <div className="pb-4 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-900">Installation Fee</p>
                          <p className="text-sm text-gray-500">Payment Terms: Once-Off</p>
                        </div>
                        <p className="font-semibold text-gray-900">R{installationFee}</p>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-gray-900">Total Due Today</p>
                      <p className="text-2xl font-bold text-circleTel-orange">R{totalAmount}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Terms and Conditions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange("acceptTerms", checked)}
                className={errors.acceptTerms ? "border-red-500" : ""}
              />
              <Label htmlFor="acceptTerms" className="text-sm cursor-pointer">
                I have read and agree to the{" "}
                <a href="/legal/terms" target="_blank" className="text-circleTel-orange hover:underline">
                  Terms & Conditions
                </a>
              </Label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-red-500 mt-2">{errors.acceptTerms}</p>}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing || !formData.acceptTerms}
            className="w-full bg-circleTel-orange hover:bg-orange-600 text-white py-6 text-lg font-semibold"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                Complete My Order
                <Lock className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Secured by Netcash PCI DSS Level 1 Compliant Gateway</span>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Copyright © 2025 CircleTel. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
