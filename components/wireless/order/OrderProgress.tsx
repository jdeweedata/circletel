"use client"

import { CheckCircle } from "lucide-react"

interface OrderProgressProps {
  currentStep: number
}

const steps = [
  { id: 1, name: "Package Selection", description: "Choose your plan" },
  { id: 2, name: "Device & SIM", description: "Select hardware" },
  { id: 3, name: "Personal Details", description: "Your information" },
  { id: 4, name: "Delivery", description: "Shipping address" },
  { id: 5, name: "Payment", description: "Complete order" }
]

export function OrderProgress({ currentStep }: OrderProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-5 h-0.5 bg-gray-200 w-full -z-10"></div>
        <div 
          className="absolute left-0 top-5 h-0.5 bg-orange-500 -z-10 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col items-center relative bg-white px-2"
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                transition-all duration-300 mb-2
                ${
                  step.id < currentStep
                    ? "bg-green-500 text-white"
                    : step.id === currentStep
                    ? "bg-orange-500 text-white ring-4 ring-orange-100"
                    : "bg-gray-200 text-gray-500"
                }
              `}
            >
              {step.id < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            <div className="text-center hidden md:block">
              <div className={`text-xs font-semibold ${
                step.id <= currentStep ? "text-gray-900" : "text-gray-400"
              }`}>
                {step.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden mt-4 text-center">
        <div className="text-sm font-semibold text-gray-900">
          Step {currentStep}: {steps[currentStep - 1].name}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {steps[currentStep - 1].description}
        </div>
      </div>
    </div>
  )
}