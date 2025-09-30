"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wifi, Router, Truck, ShieldCheck, Clock, Info } from "lucide-react"

interface Package {
  id: string
  name: string
  speed: string
  price: number
  description: string
  features: string[]
}

const packages: Record<string, Package> = {
  "20mbps": {
    id: "20mbps",
    name: "Basic Wireless",
    speed: "20Mbps",
    price: 299,
    description: "Uncapped anytime",
    features: [
      "Unlimited data",
      "20Mbps download speed",
      "5Mbps upload speed",
      "Basic support"
    ]
  },
  "50mbps": {
    id: "50mbps",
    name: "Standard Wireless",
    speed: "50Mbps",
    price: 399,
    description: "Uncapped anytime",
    features: [
      "Unlimited data",
      "50Mbps download speed",
      "10Mbps upload speed",
      "Priority support"
    ]
  },
  "100mbps": {
    id: "100mbps",
    name: "Fast Wireless",
    speed: "100Mbps",
    price: 599,
    description: "Uncapped anytime",
    features: [
      "Unlimited data",
      "100Mbps download speed",
      "20Mbps upload speed",
      "Priority support",
      "Free router upgrade"
    ]
  },
  "premium": {
    id: "premium",
    name: "Premium Wireless",
    speed: "Premium",
    price: 949,
    description: "Uncapped anytime - Maximum speed",
    features: [
      "Unlimited data",
      "Maximum available speed",
      "50Mbps upload speed",
      "24/7 Premium support",
      "FREE premium router",
      "FREE installation"
    ]
  }
}

interface OrderSummaryProps {
  packageId: string
}

export function OrderSummary({ packageId }: OrderSummaryProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [addOns, setAddOns] = useState({
    router: false,
    installation: false,
    insurance: false
  })

  useEffect(() => {
    setSelectedPackage(packages[packageId] || packages.premium)
  }, [packageId])

  if (!selectedPackage) return null

  const routerPrice = selectedPackage.id === "premium" ? 0 : 999
  const installationPrice = selectedPackage.id === "premium" ? 0 : 299
  const insurancePrice = 49

  const calculateTotal = () => {
    let total = selectedPackage.price
    if (addOns.router) total += routerPrice
    if (addOns.installation) total += installationPrice
    if (addOns.insurance) total += insurancePrice
    return total
  }

  const savings = () => {
    let saved = 0
    if (selectedPackage.id === "premium") {
      saved += 999 // Free router
      saved += 299 // Free installation
    }
    return saved
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Order Summary</h3>
        <p className="text-orange-100 text-sm">Your CircleTel Wireless Package</p>
      </div>

      {/* Package Details */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900">{selectedPackage.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{selectedPackage.speed} • {selectedPackage.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">R{selectedPackage.price}</div>
            <div className="text-xs text-gray-500">per month</div>
          </div>
        </div>

        {/* Package Features */}
        <div className="space-y-2 mt-4">
          {selectedPackage.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div className="p-6 border-b">
        <h5 className="font-semibold text-gray-900 mb-4">Optional Add-ons</h5>
        
        <div className="space-y-3">
          {/* Router */}
          <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={addOns.router}
                onChange={(e) => setAddOns({ ...addOns, router: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                disabled={selectedPackage.id === "premium"}
              />
              <Router className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-sm text-gray-900">5G Router</div>
                <div className="text-xs text-gray-500">High-speed wireless router</div>
              </div>
            </div>
            <div className="text-right">
              {selectedPackage.id === "premium" ? (
                <span className="text-green-600 font-semibold text-sm">FREE</span>
              ) : (
                <span className="font-semibold text-sm">R{routerPrice}</span>
              )}
            </div>
          </label>

          {/* Installation */}
          <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={addOns.installation}
                onChange={(e) => setAddOns({ ...addOns, installation: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                disabled={selectedPackage.id === "premium"}
              />
              <Truck className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-sm text-gray-900">Professional Installation</div>
                <div className="text-xs text-gray-500">Expert setup at your location</div>
              </div>
            </div>
            <div className="text-right">
              {selectedPackage.id === "premium" ? (
                <span className="text-green-600 font-semibold text-sm">FREE</span>
              ) : (
                <span className="font-semibold text-sm">R{installationPrice}</span>
              )}
            </div>
          </label>

          {/* Insurance */}
          <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={addOns.insurance}
                onChange={(e) => setAddOns({ ...addOns, insurance: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-sm text-gray-900">Device Protection</div>
                <div className="text-xs text-gray-500">Coverage for damage & theft</div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-semibold text-sm">R{insurancePrice}/mo</span>
            </div>
          </label>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="p-6 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monthly Package</span>
            <span className="font-medium">R{selectedPackage.price}</span>
          </div>
          
          {addOns.router && routerPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">5G Router</span>
              <span className="font-medium">R{routerPrice}</span>
            </div>
          )}
          
          {addOns.installation && installationPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Installation</span>
              <span className="font-medium">R{installationPrice}</span>
            </div>
          )}
          
          {addOns.insurance && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Device Protection</span>
              <span className="font-medium">R{insurancePrice}/mo</span>
            </div>
          )}

          {savings() > 0 && (
            <div className="flex justify-between text-sm text-green-600 pt-2 border-t">
              <span>You Save</span>
              <span className="font-bold">R{savings()}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-300">
            <span>Total</span>
            <span className="text-orange-600">R{calculateTotal()}/mo</span>
          </div>
        </div>

        {/* Promo Banner */}
        {selectedPackage.id === "premium" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-xs text-green-800">
                <strong>Premium Benefits:</strong> You're getting FREE router (R999 value) and FREE installation (R299 value)!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}