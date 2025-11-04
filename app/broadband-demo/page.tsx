import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Unlimited Internet | CircleTel',
  description: 'Unlimited. Uncomplicated. Unbeatable. Simply CircleTel.',
}

export default function BroadbandDemo() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-circleTel-orange rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">CircleTel</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#" className="text-gray-700 hover:text-circleTel-orange font-medium">Speed Calculator</a>
                <a href="#" className="text-gray-700 hover:text-circleTel-orange font-medium">Choose a Plan</a>
                <a href="#" className="text-gray-700 hover:text-circleTel-orange font-medium">Help Centre</a>
                <a href="#" className="text-gray-700 hover:text-circleTel-orange font-medium">FAQ</a>
                <a href="#" className="text-gray-700 hover:text-circleTel-orange font-medium">Contact us</a>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-gray-50">
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-green-100">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{
              backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600">
                  <defs>
                    <pattern id="wood" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="#8B4513"/>
                      <path d="M0,0 L100,10 L100,20 L0,30 Z" fill="#A0522D" opacity="0.5"/>
                      <path d="M0,30 L100,40 L100,50 L0,60 Z" fill="#A0522D" opacity="0.3"/>
                      <path d="M0,60 L100,70 L100,80 L0,90 Z" fill="#A0522D" opacity="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#wood)"/>
                </svg>
              `)}')`
            }}
          />
          {/* People overlay representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Laptop representation */}
              <div className="w-64 h-40 bg-gray-800 rounded-lg mx-auto mb-8 relative">
                <div className="w-56 h-32 bg-green-600 rounded m-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">C</span>
                  </div>
                </div>
              </div>
              
              {/* People silhouettes */}
              <div className="absolute -top-10 -left-20 w-32 h-32 rounded-full bg-blue-400 opacity-70"></div>
              <div className="absolute -top-5 -right-16 w-28 h-28 rounded-full bg-yellow-400 opacity-70"></div>
              <div className="absolute top-20 -left-10 w-24 h-24 rounded-full bg-green-400 opacity-70"></div>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="block">Unlimited. Uncomplicated. Unbeatable.</span>
            <span className="text-circleTel-orange block mt-2">Simply CircleTel.</span>
          </h1>
          
          {/* Scroll down indicator */}
          <div className="mt-12">
            <div className="w-8 h-12 border-2 border-white rounded-full mx-auto flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Plans Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our plans</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Fibre Essential */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Fibre Essential</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">$59.99</div>
              <div className="text-sm text-gray-500 mb-6">per month</div>
              
              <div className="text-left space-y-3 mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed 100/20 Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unlimited data</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No fixed term contract</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No connection fee</span>
                </div>
              </div>
              
              <button className="w-full bg-circleTel-orange text-white py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors">
                CHECK ADDRESS
              </button>
            </div>

            {/* Fibre Plus */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-circleTel-orange">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Fibre Plus</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">$79.99</div>
              <div className="text-sm text-gray-500 mb-6">per month</div>
              
              <div className="text-left space-y-3 mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed 200/100 Mbps with unlimited downloads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unlimited data</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No fixed term contract</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No connection fee</span>
                </div>
              </div>
              
              <button className="w-full bg-circleTel-orange text-white py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors">
                CHECK ADDRESS
              </button>
            </div>

            {/* Fibre Pro */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Fibre Pro</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">$99.99</div>
              <div className="text-sm text-gray-500 mb-6">per month</div>
              
              <div className="text-left space-y-3 mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed 500/300 Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unlimited data</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No fixed term contract</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No connection fee</span>
                </div>
              </div>
              
              <button className="w-full bg-circleTel-orange text-white py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors">
                CHECK ADDRESS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Calculator Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {/* Laptop Mockup */}
              <div className="relative">
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-gray-800 rounded-lg p-4 shadow-2xl">
                    <div className="bg-black rounded h-48 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <div className="text-green-400 text-sm">CircleTel</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">What speed do you need?</h2>
              <p className="text-lg mb-8 text-green-100">
                Our research showed that many customers will always choose the middle option when it comes to speed. The low plan will be too slow for them, and the high plan is for the hard core gamers out there. But which plan meets your household&apos;s speed needs?
              </p>
              <button className="bg-white text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                USE OUR SPEED CALCULATOR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Simple home broadband for South Africans</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Top Row */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choice of Speed</h3>
              <p className="text-gray-600">Pay for the speed you need, not what others say you need</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L4.414 9H17a1 1 0 100-2H4.414l1.879-1.879z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlimited Data</h3>
              <p className="text-gray-600">No caps, data restrictions with any of our simple plans</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No fixed term contract</h3>
              <p className="text-gray-600">You stay term commitment and month to month. Just 30 days notice</p>
            </div>

            {/* Bottom Row */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Great Value</h3>
              <p className="text-gray-600">Three simple combined plans to choose from</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">SA Owned & Operated</h3>
              <p className="text-gray-600">Proud Kiwi outfit! Headquarters in Auckland, Wellington Auckland</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">BYO Modem</h3>
              <p className="text-gray-600">We make it simple to use the modem you already have</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-circleTel-orange rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold">CircleTel</span>
              </div>
              <p className="text-gray-400 text-sm">
                We want you to call unlimited; we reserve and to let be the fastest you can achieve at your actual location.
              </p>
              <button className="mt-4 bg-circleTel-orange text-white px-6 py-2 rounded-full text-sm font-medium">
                Check for email plans
              </button>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white">Privacy policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Speed calculator</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Centre</a></li>
                <li><a href="#" className="hover:text-white">Privacy policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company Policy</h4>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2025 CircleTel All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  )
}