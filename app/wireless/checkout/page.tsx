"use client"

import { Suspense } from "react"
import { NetcashCheckoutForm } from "@/components/wireless/checkout/NetcashCheckoutForm"
import { CheckoutSummary } from "@/components/wireless/checkout/CheckoutSummary"
import { OrderProgress } from "@/components/wireless/order/OrderProgress"
import { SecureCheckoutBadges } from "@/components/wireless/checkout/SecureCheckoutBadges"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

function CheckoutContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/wireless/order?package=premium" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Order
            </Link>
            <div className="text-2xl font-bold italic text-orange-500">
              CircleTel wireless
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <OrderProgress currentStep={5} />
        </div>
      </div>

      {/* Security Badges */}
      <div className="container mx-auto px-4 py-4">
        <SecureCheckoutBadges />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Checkout Form with Netcash Integration */}
          <div>
            <NetcashCheckoutForm />
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit">
            <CheckoutSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing secure checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}