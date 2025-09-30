"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, Wifi, Router, Truck, 
  Tag, Info, Clock, CheckCircle 
} from "lucide-react"

interface OrderItem {
  name: string
  description: string
  price: number
  quantity: number
  recurring: boolean
}

export function CheckoutSummary() {
  const [orderDetails] = useState({
    package: {
      name: "Premium Wireless",
      speed: "Premium Speed",
      price: 949,
      description: "Uncapped anytime - Maximum speed"
    },
    addOns: {
      router: { included: true, value: 999 },
      installation: { included: true, value: 299 },
      insurance: { selected: true, price: 49 }
    },
    delivery: {
      method: "standard",
      price: 0
    },
    promoCode: "",
    discount: 0
  })

  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const applyPromoCode = () => {
    // Simulate promo code validation
    if (promoCode.toUpperCase() === "SAVE10") {
      setPromoDiscount(orderDetails.package.price * 0.1)
      setPromoApplied(true)
    } else if (promoCode.toUpperCase() === "WELCOME50") {
      setPromoDiscount(50)
      setPromoApplied(true)
    } else {
      alert("Invalid promo code")
    }
  }

  const calculateSubtotal = () => {
    let total = orderDetails.package.price
    if (orderDetails.addOns.insurance.selected) {
      total += orderDetails.addOns.insurance.price
    }
    return total
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const total = subtotal - promoDiscount
    return total
  }

  const totalSavings = () => {
    let savings = 0
    if (orderDetails.addOns.router.included) savings += orderDetails.addOns.router.value
    if (orderDetails.addOns.installation.included) savings += orderDetails.addOns.installation.value
    savings += promoDiscount
    return savings
  }

  return (
    <div className="space-y-6">
      {/* Main Order Summary Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Order Summary</h3>
          <p className="text-orange-100 text-sm">Review your order details</p>
        </div>

        {/* Order Items */}
        <div className="p-6 border-b">
          <h4 className="font-semibold text-gray-900 mb-4">Your Package</h4>
          
          {/* Main Package */}
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{orderDetails.package.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {orderDetails.package.speed} • {orderDetails.package.description}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Tag className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">First month special</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">R{orderDetails.package.price}</div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
            </div>
          </div>

          {/* Included Items */}
          <div className="space-y-3 pt-3 border-t">
            <div className="text-xs font-semibold text-gray-700 mb-2">Included with Premium:</div>
            
            {orderDetails.addOns.router.included && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Router className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">5G Router</span>
                </div>
                <span className="text-green-600 font-medium">FREE (R{orderDetails.addOns.router.value} value)</span>
              </div>
            )}

            {orderDetails.addOns.installation.included && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Professional Installation</span>
                </div>
                <span className="text-green-600 font-medium">FREE (R{orderDetails.addOns.installation.value} value)</span>
              </div>
            )}

            {orderDetails.addOns.insurance.selected && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">Device Protection</span>
                </div>
                <span className="font-medium">R{orderDetails.addOns.insurance.price}/mo</span>
              </div>
            )}
          </div>
        </div>

        {/* Promo Code */}
        <div className="p-6 border-b bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Promo Code
          </label>
          {!promoApplied ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button
                onClick={applyPromoCode}
                variant="outline"
                size="sm"
                className="px-4"
              >
                Apply
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Promo code "{promoCode}" applied!
                </span>
              </div>
              <button
                onClick={() => {
                  setPromoApplied(false)
                  setPromoCode("")
                  setPromoDiscount(0)
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Try: SAVE10 for 10% off or WELCOME50 for R50 off
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="p-6 bg-white">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">R{calculateSubtotal()}</span>
            </div>

            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promo Discount</span>
                <span className="font-medium">-R{promoDiscount}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>

            {totalSavings() > 0 && (
              <div className="pt-3 mt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">Total Savings</span>
                  <span className="text-green-600 font-bold">R{totalSavings()}</span>
                </div>
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-gray-300">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm text-gray-600">Total Due Today</div>
                  <div className="text-xs text-gray-500 mt-1">First month payment</div>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  R{calculateTotal()}
                </div>
              </div>
            </div>

            <div className="pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Recurring</span>
                <span className="font-medium">R{calculateTotal()}/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-blue-900">Estimated Delivery</div>
            <div className="text-sm text-blue-700 mt-1">
              2-3 business days after order confirmation
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Free standard delivery on all orders
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-gray-900">Need Help?</div>
            <div className="text-sm text-gray-600 mt-1">
              Call us at <span className="font-semibold">0860 123 456</span> or
            </div>
            <a href="#" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Chat with support →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}