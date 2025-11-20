"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard, Smartphone, Building2, Calendar,
  Lock, ShieldCheck, AlertCircle, CheckCircle,
  Loader2, ChevronRight, Info, Eye, EyeOff,
  AlertTriangle, ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { netcashConfig } from "@/lib/payment/netcash-config"
import { PaymentDisclaimerCard } from "@/components/payments/PaymentDisclaimerCard"
import { PaymentConsentCheckboxes, type PaymentConsents } from "@/components/payments/PaymentConsentCheckboxes"
import { validateConsents } from "@/lib/constants/policy-versions"

export function CheckoutForm() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardType, setCardType] = useState("")
  const [useTestCard, setUseTestCard] = useState(false)
  const [tokenizedCard, setTokenizedCard] = useState<{token?: string, maskedCard?: string}>({})
  
  const [formData, setFormData] = useState({
    // Payment Details
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",

    // Bank Details (for EFT)
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branchCode: "",

    // Billing Address
    billingAddress: "same", // same or different
    billingStreet: "",
    billingSuburb: "",
    billingCity: "",
    billingProvince: "",
    billingPostalCode: "",

    // Agreement
    autoRenewal: true,
    savePaymentMethod: true,
    consents: {
      terms: false,
      privacy: false,
      paymentTerms: false,
      refundPolicy: false,
      recurringPayment: false,
      marketing: false,
    } as PaymentConsents,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [consentErrors, setConsentErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Card number formatting and type detection
    if (field === "cardNumber") {
      const cleaned = value.replace(/\s/g, "")
      const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
      
      // Detect card type
      if (cleaned.startsWith("4")) {
        setCardType("visa")
      } else if (cleaned.startsWith("5")) {
        setCardType("mastercard")
      } else if (cleaned.startsWith("3")) {
        setCardType("amex")
      } else {
        setCardType("")
      }
      
      setFormData(prev => ({
        ...prev,
        cardNumber: formatted
      }))
    }
  }

  const handleConsentChange = (consents: PaymentConsents) => {
    setFormData((prev) => ({ ...prev, consents }))
    // Clear consent errors when user makes changes
    if (consentErrors.length > 0) {
      setConsentErrors([])
    }
  }

  const fillTestCardDetails = () => {
    const testCard = netcashConfig.testCards.visa
    setFormData(prev => ({
      ...prev,
      cardNumber: testCard.number.match(/.{1,4}/g)?.join(" ") || testCard.number,
      cardName: "Test User",
      expiryMonth: testCard.expiry.split('/')[0],
      expiryYear: testCard.expiry.split('/')[1],
      cvv: testCard.cvv
    }))
    setCardType("visa")
    setUseTestCard(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (paymentMethod === "card") {
      if (!formData.cardNumber) newErrors.cardNumber = "Card number is required"
      if (!formData.cardName) newErrors.cardName = "Cardholder name is required"
      if (!formData.expiryMonth) newErrors.expiryMonth = "Expiry month is required"
      if (!formData.expiryYear) newErrors.expiryYear = "Expiry year is required"
      if (!formData.cvv) newErrors.cvv = "CVV is required"
    } else if (paymentMethod === "eft") {
      if (!formData.bankName) newErrors.bankName = "Bank name is required"
      if (!formData.accountHolder) newErrors.accountHolder = "Account holder name is required"
      if (!formData.accountNumber) newErrors.accountNumber = "Account number is required"
      if (!formData.branchCode) newErrors.branchCode = "Branch code is required"
    }

    // Validate consents
    const consentValidation = validateConsents(formData.consents)
    setConsentErrors(consentValidation.errors)

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && consentValidation.valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      if (paymentMethod === "card") {
        // Step 1: Tokenize the card
        const tokenizeResponse = await fetch('/api/payment/netcash/tokenize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cardDetails: {
              cardNumber: formData.cardNumber,
              cardName: formData.cardName,
              expiryMonth: formData.expiryMonth,
              expiryYear: formData.expiryYear,
              cvv: formData.cvv
            }
          })
        })

        const tokenResult = await tokenizeResponse.json()

        if (!tokenResult.success) {
          throw new Error(tokenResult.error || 'Failed to tokenize card')
        }

        setTokenizedCard({
          token: tokenResult.token,
          maskedCard: tokenResult.maskedCard
        })

        // Step 2: Process the payment
        const paymentResponse = await fetch('/api/payment/netcash/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 998, // Amount from order
            description: 'CircleTel Wireless Premium Package',
            customerEmail: 'customer@example.com', // From order form
            customerName: formData.cardName,
            customerPhone: '0821234567', // From order form
            token: tokenResult.token,
            recurring: formData.autoRenewal
          })
        })

        const paymentResult = await paymentResponse.json()

        if (paymentResult.success) {
          // For testing, we'll redirect to success page
          // In production, this would redirect to Netcash payment page
          if (paymentResult.paymentUrl) {
            // Show Netcash payment modal or redirect
            console.log('Payment URL:', paymentResult.paymentUrl)
          }
          
          // Simulate successful payment for testing
          setTimeout(() => {
            router.push('/wireless/order/success')
          }, 2000)
        } else {
          throw new Error(paymentResult.error || 'Payment failed')
        }
      } else {
        // Handle other payment methods
        setTimeout(() => {
          router.push('/wireless/order/success')
        }, 3000)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessing(false)
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.')
    }
  }

  const CardIcon = ({ type }: { type: string }) => {
    if (type === "visa") {
      return <div className="text-blue-600 font-bold text-xs">VISA</div>
    }
    if (type === "mastercard") {
      return <div className="text-red-600 font-bold text-xs">MC</div>
    }
    if (type === "amex") {
      return <div className="text-blue-500 font-bold text-xs">AMEX</div>
    }
    return <CreditCard className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h2>
        <p className="text-gray-600">Complete your order with Netcash secure payment gateway</p>
        
        {/* Netcash Badge */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span>Secured by Netcash PCI DSS Compliant Gateway</span>
          </div>
          <a 
            href="https://netcash.co.za" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Powered by Netcash</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Test Mode Banner */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-800 text-sm">Test Mode Active</div>
              <div className="text-yellow-700 text-xs mt-1">
                You're in staging environment. Use test card numbers for testing.
              </div>
              <Button
                type="button"
                onClick={fillTestCardDetails}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Fill Test Card Details
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6">
        {/* Payment Method Selection */}
        <div className="mb-6">
          <Label className="text-base font-semibold mb-4 block">Payment Method</Label>
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="card" className="py-3">
                <CreditCard className="w-4 h-4 mr-2" />
                Credit/Debit Card
              </TabsTrigger>
              <TabsTrigger value="eft" className="py-3">
                <Building2 className="w-4 h-4 mr-2" />
                Bank EFT
              </TabsTrigger>
              <TabsTrigger value="mobile" className="py-3">
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile Payment
              </TabsTrigger>
            </TabsList>

            {/* Credit/Debit Card */}
            <TabsContent value="card" className="mt-6 space-y-4">
              {/* Tokenized Card Display */}
              {tokenizedCard.maskedCard && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Card tokenized securely: {tokenizedCard.maskedCard}
                    </span>
                  </div>
                </div>
              )}

              {/* Card Number */}
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative mt-1">
                  <Input
                    id="cardNumber"
                    type={showCardNumber ? "text" : "password"}
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`pr-20 ${errors.cardNumber ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCardNumber(!showCardNumber)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {showCardNumber ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <CardIcon type={cardType} />
                  </div>
                </div>
                {errors.cardNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Card Holder Name */}
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  type="text"
                  value={formData.cardName}
                  onChange={(e) => handleInputChange("cardName", e.target.value)}
                  placeholder="John Doe"
                  className={`mt-1 ${errors.cardName ? 'border-red-500' : ''}`}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                )}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiryMonth">Expiry Month</Label>
                  <select
                    id="expiryMonth"
                    value={formData.expiryMonth}
                    onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
                    className={`mt-1 w-full rounded-md border px-3 py-2 ${errors.expiryMonth ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString().padStart(2, "0")}>
                        {month.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  {errors.expiryMonth && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiryMonth}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expiryYear">Expiry Year</Label>
                  <select
                    id="expiryYear"
                    value={formData.expiryYear}
                    onChange={(e) => handleInputChange("expiryYear", e.target.value)}
                    className={`mt-1 w-full rounded-md border px-3 py-2 ${errors.expiryYear ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">YY</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year.toString().slice(-2)}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.expiryYear && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiryYear}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cvv">
                    CVV
                    <Info className="w-3 h-3 inline-block ml-1 text-gray-400" />
                  </Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={`mt-1 ${errors.cvv ? 'border-red-500' : ''}`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Secure Payment Notice */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-xs text-green-800">
                    <strong>PCI DSS Compliant:</strong> Your payment information is tokenized and encrypted using Netcash PCI Vault. 
                    We never store your full card details.
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bank EFT */}
            <TabsContent value="eft" className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Netcash Debit Order:</strong> Your monthly subscription will be automatically debited from your account using Netcash's secure debit order system.
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <select
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Bank</option>
                  <option value="fnb">FNB</option>
                  <option value="standard">Standard Bank</option>
                  <option value="absa">ABSA</option>
                  <option value="nedbank">Nedbank</option>
                  <option value="capitec">Capitec</option>
                </select>
              </div>

              <div>
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => handleInputChange("accountHolder", e.target.value)}
                  placeholder="As it appears on your bank account"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="password"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                    placeholder="Enter account number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="branchCode">Branch Code</Label>
                  <Input
                    id="branchCode"
                    type="text"
                    value={formData.branchCode}
                    onChange={(e) => handleInputChange("branchCode", e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Mobile Payment */}
            <TabsContent value="mobile" className="mt-6">
              <div className="text-center py-8">
                <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Netcash Mobile Payment</h3>
                <p className="text-gray-600 mb-6">Quick and secure mobile payment powered by Netcash</p>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <button
                    type="button"
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
                  >
                    <div className="font-semibold text-green-600">SnapScan</div>
                    <div className="text-xs text-gray-500 mt-1">Scan to pay</div>
                  </button>
                  <button
                    type="button"
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
                  >
                    <div className="font-semibold text-blue-600">Zapper</div>
                    <div className="text-xs text-gray-500 mt-1">Quick payment</div>
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Billing Address */}
        <div className="mb-6">
          <Label className="text-base font-semibold mb-4 block">Billing Address</Label>
          <RadioGroup 
            value={formData.billingAddress} 
            onValueChange={(value) => handleInputChange("billingAddress", value)}
          >
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="same" />
                <div>
                  <div className="font-medium text-sm">Same as delivery address</div>
                  <div className="text-xs text-gray-500">Use the address provided during order</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="different" />
                <div>
                  <div className="font-medium text-sm">Use a different billing address</div>
                  <div className="text-xs text-gray-500">Specify a separate billing address</div>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Agreement and Terms */}
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Subscription Settings</h4>
            
            <label className="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                checked={formData.autoRenewal}
                onChange={(e) => handleInputChange("autoRenewal", e.target.checked)}
                className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Auto-renewal via Netcash</div>
                <div className="text-xs text-gray-600">
                  Your subscription will automatically renew each month using Netcash recurring payments
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.savePaymentMethod}
                onChange={(e) => handleInputChange("savePaymentMethod", e.target.checked)}
                className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Save payment method</div>
                <div className="text-xs text-gray-600">
                  Securely tokenize and save in Netcash PCI Vault for faster checkout
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Payment Security Disclaimer */}
        <div className="mb-6">
          <PaymentDisclaimerCard variant="compact" />
        </div>

        {/* Legal Consents */}
        <div className="mb-6">
          <PaymentConsentCheckboxes
            consents={formData.consents}
            onConsentChange={handleConsentChange}
            showRecurringPayment={formData.autoRenewal}
            showMarketing={true}
            errors={consentErrors}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing}
          className="w-full py-6 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing via Netcash...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Pay Securely - R998/mo
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4" />
            <span>Secured by Netcash PCI DSS Level 1 Compliant Gateway</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            PCI Vault Key: {netcashConfig.pciVault.key.slice(0, 8)}****
          </div>
        </div>
      </form>
    </div>
  )
}

// Export alias for backward compatibility
export const NetcashCheckoutForm = CheckoutForm