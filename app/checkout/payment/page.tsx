"use client"

import { Suspense } from "react"
import { CircleTelPaymentPage } from "@/components/checkout/CircleTelPaymentPage"
import { OrderContextProvider } from "@/components/order/context/OrderContext"

function PaymentContent() {
  return <CircleTelPaymentPage variant="home-internet" />
}

export default function PaymentPage() {
  return (
    <OrderContextProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment page...</p>
            </div>
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </OrderContextProvider>
  )
}
