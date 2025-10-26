import React from 'react'

interface ProgressStep {
  number: number
  label: string
  status: 'completed' | 'active' | 'upcoming'
  sublabel?: string
}

interface FullWidthProgressBarProps {
  steps: ProgressStep[]
  progressPercentage: number
}

export default function FullWidthProgressBar({ steps, progressPercentage }: FullWidthProgressBarProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Progress Bar Header - Full Width */}
      <div className="w-full bg-gradient-to-r from-circleTel-orange via-orange-500 to-circleTel-orange">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto relative">
            {/* Desktop Progress Bar */}
            <div className="hidden md:flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex items-center flex-1">
                    <div className="flex items-center gap-3 relative">
                      {/* Step Circle */}
                      <div
                        className={`
                          relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                          transition-all duration-300
                          ${
                            step.status === 'active'
                              ? 'bg-white text-circleTel-orange shadow-lg ring-4 ring-white/30'
                              : step.status === 'completed'
                              ? 'bg-white text-circleTel-orange shadow-lg'
                              : 'bg-white/30 text-white/80'
                          }
                        `}
                      >
                        <span>{step.number}</span>
                      </div>

                      {/* Step Label */}
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-semibold whitespace-nowrap ${
                            step.status === 'active' || step.status === 'completed'
                              ? 'text-white'
                              : 'text-white/70'
                          }`}
                        >
                          {step.label}
                        </span>
                        {step.sublabel && (
                          <span className="text-xs text-white/80 font-medium">{step.sublabel}</span>
                        )}
                      </div>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-4 relative min-w-[60px]">
                        <div className="absolute inset-0 bg-white/30 rounded-full"></div>
                        <div
                          className="absolute inset-0 bg-white rounded-full transition-all duration-500"
                          style={{
                            width: step.status === 'completed' ? '100%' : '0%',
                            transformOrigin: 'left center',
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Mobile Progress Bar */}
            <div className="flex md:hidden items-center justify-between relative px-2">
              {/* Background Line */}
              <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/30 -translate-y-1/2">
                <div
                  className="h-full bg-white transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* Steps */}
              {steps.map((step) => (
                <div key={step.number} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs
                      transition-all duration-300
                      ${
                        step.status === 'active'
                          ? 'bg-white text-circleTel-orange shadow-lg ring-2 ring-white/30'
                          : step.status === 'completed'
                          ? 'bg-white text-circleTel-orange shadow-lg'
                          : 'bg-white/30 text-white/80'
                      }
                    `}
                  >
                    <span>{step.number}</span>
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      step.status === 'active' || step.status === 'completed'
                        ? 'text-white'
                        : 'text-white/70'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Security Badge - Desktop Only */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-white"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span className="text-sm font-semibold text-white">Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Full Width Responsive */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Your content goes here */}
        </div>
      </div>
    </div>
  )
}
