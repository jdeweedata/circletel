"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, Package, Truck, Mail, 
  Phone, MessageSquare, Download, Home,
  Calendar, Clock, FileText, ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage() {
  const [orderNumber] = useState(`CW${Date.now().toString().slice(-8)}`)
  const [email] = useState("john.doe@example.com") // This would come from the order context
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Trigger success animation
    setShowAnimation(true)
  }, [])

  const nextSteps = [
    {
      icon: Package,
      title: "Order Processing",
      description: "Your order is being prepared",
      status: "In Progress",
      time: "Started just now"
    },
    {
      icon: Truck,
      title: "Delivery",
      description: "Expected in 2-3 business days",
      status: "Pending",
      time: "Updates via SMS"
    },
    {
      icon: Calendar,
      title: "Installation (if selected)",
      description: "We'll contact you to schedule",
      status: "Pending",
      time: "Within 24 hours"
    }
  ]

  const actions = [
    {
      icon: FileText,
      title: "View Order Details",
      description: "Review your complete order",
      link: "#"
    },
    {
      icon: Download,
      title: "Download Invoice",
      description: "Get your tax invoice",
      link: "#"
    },
    {
      icon: MessageSquare,
      title: "Track Your Order",
      description: "Real-time delivery updates",
      link: "#"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <div className="text-2xl font-bold italic text-orange-500">
              CircleTel wireless
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.5s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>

      {/* Success Message */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Card */}
          <div className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 ${showAnimation ? 'animate-fade-in-scale' : ''}`}>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center text-white">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 animate-bounce-in">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-green-100 text-lg">
                Thank you for choosing CircleTel Wireless
              </p>
            </div>

            <div className="p-8">
              {/* Order Details */}
              <div className="text-center mb-8">
                <div className="text-sm text-gray-500 mb-1">Order Number</div>
                <div className="text-2xl font-bold text-gray-900 mb-4">{orderNumber}</div>
                <div className="text-gray-600">
                  A confirmation email has been sent to{" "}
                  <span className="font-semibold text-gray-900">{email}</span>
                </div>
              </div>

              {/* Package Summary */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Your Package</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900">Premium Wireless</div>
                    <div className="text-gray-600 mt-1">Uncapped • Maximum Speed</div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        FREE 5G Router
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        FREE Installation
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">R949</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>
              </div>

              {/* Next Steps Timeline */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">What Happens Next</h3>
                <div className="space-y-4">
                  {nextSteps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="relative">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${step.status === "In Progress" ? "bg-orange-100" : "bg-gray-100"}
                          `}>
                            <Icon className={`w-5 h-5 ${
                              step.status === "In Progress" ? "text-orange-600" : "text-gray-400"
                            }`} />
                          </div>
                          {index < nextSteps.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{step.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            </div>
                            <div className="text-right">
                              <div className={`
                                inline-flex px-2 py-1 rounded-full text-xs font-medium
                                ${step.status === "In Progress" 
                                  ? "bg-orange-100 text-orange-700" 
                                  : "bg-gray-100 text-gray-600"}
                              `}>
                                {step.status}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{step.time}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {actions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <a
                      key={index}
                      href={action.link}
                      className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                    >
                      <Icon className="w-5 h-5 text-gray-400 group-hover:text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{action.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                    </a>
                  )
                })}
              </div>

              {/* Contact Support */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Call: </span>
                    <span className="font-semibold text-gray-900">0860 123 456</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Email: </span>
                    <span className="font-semibold text-gray-900">support@circletel.co.za</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <a href="#" className="font-semibold text-orange-600 hover:text-orange-700">
                      Live Chat →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/dashboard">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8">
                Go to My Account
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="px-8">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}