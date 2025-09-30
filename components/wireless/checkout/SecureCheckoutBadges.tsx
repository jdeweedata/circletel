"use client"

import { Shield, Lock, CreditCard, CheckCircle } from "lucide-react"

export function SecureCheckoutBadges() {
  const badges = [
    {
      icon: Lock,
      text: "Secure Checkout",
      subtext: "256-bit SSL Encryption"
    },
    {
      icon: Shield,
      text: "PCI DSS Compliant",
      subtext: "Your data is protected"
    },
    {
      icon: CreditCard,
      text: "Safe Payments",
      subtext: "Verified by major banks"
    },
    {
      icon: CheckCircle,
      text: "Money Back Guarantee",
      subtext: "14-day satisfaction guarantee"
    }
  ]

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-center gap-6">
        {badges.map((badge, index) => {
          const Icon = badge.icon
          return (
            <div key={index} className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{badge.text}</div>
                <div className="text-xs text-gray-600">{badge.subtext}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}