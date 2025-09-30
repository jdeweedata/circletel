"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wifi, Router, Smartphone, Package, ChevronRight,
  Info, Shield, Zap, Clock, Phone, Mail,
  MapPin, CreditCard, Building2, Home
} from "lucide-react"
import { useRouter } from "next/navigation"

interface WirelessOrderFormProps {
  packageId: string
}

export function WirelessOrderForm({ packageId }: WirelessOrderFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("device")
  const [formData, setFormData] = useState({
    // Device Selection
    deviceType: "sim-router",
    routerModel: "standard",
    simOnly: false,
    
    // Personal Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    
    // Installation
    installationType: "self",
    preferredDate: "",
    preferredTime: "",
    
    // Address
    addressType: "residential",
    streetAddress: "",
    suburb: "",
    city: "",
    province: "",
    postalCode: "",
    
    // Additional
    referralCode: "",
    termsAccepted: false,
    marketingAccepted: false
  })

  const deviceOptions = [
    {
      id: "sim-router",
      name: "SIM + Router Bundle",
      description: "Complete package with 5G router and SIM card",
      price: packageId === "premium" ? "FREE" : "R999",
      recommended: true,
      features: ["5G/LTE Router included", "Plug and play setup", "12-month warranty"]
    },
    {
      id: "sim-only",
      name: "SIM Only",
      description: "Just the SIM card - use your own router",
      price: "FREE SIM",
      features: ["Works with any compatible router", "Quick activation", "No hardware costs"]
    },
    {
      id: "router-upgrade",
      name: "Premium Router Bundle",
      description: "Advanced 5G router with extended range",
      price: "R1499",
      features: ["WiFi 6 technology", "Extended range", "24-month warranty", "Advanced security"]
    }
  ]

  const routerModels = [
    {
      id: "standard",
      name: "Standard 5G Router",
      specs: "WiFi 5 • Up to 1.2Gbps • 32 devices",
      price: packageId === "premium" ? 0 : 999
    },
    {
      id: "advanced",
      name: "Advanced 5G Router",
      specs: "WiFi 6 • Up to 3Gbps • 64 devices",
      price: 1499
    },
    {
      id: "premium",
      name: "Premium 5G Pro Router",
      specs: "WiFi 6E • Up to 6Gbps • 128 devices • Mesh capable",
      price: 2499
    }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    const tabs = ["device", "details", "installation", "address"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    } else {
      // Proceed to checkout
      router.push("/wireless/checkout")
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <TabsList className="w-full rounded-t-xl rounded-b-none h-auto p-0 bg-gray-100">
          <div className="grid grid-cols-4 w-full">
            <TabsTrigger 
              value="device" 
              className="rounded-none rounded-tl-xl py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Router className="w-4 h-4" />
                <span className="hidden sm:inline">Device</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="details"
              className="rounded-none py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Details</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="installation"
              className="rounded-none py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Setup</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="address"
              className="rounded-none rounded-tr-xl py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Address</span>
              </div>
            </TabsTrigger>
          </div>
        </TabsList>

        {/* Device Selection */}
        <TabsContent value="device" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Device Option</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select how you'd like to receive your wireless service
              </p>
            </div>

            <RadioGroup 
              value={formData.deviceType} 
              onValueChange={(value) => handleInputChange("deviceType", value)}
            >
              <div className="space-y-4">
                {deviceOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`
                      relative flex cursor-pointer rounded-xl border p-4 hover:bg-gray-50 transition-colors
                      ${formData.deviceType === option.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
                    `}
                  >
                    <RadioGroupItem value={option.id} className="sr-only" />
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`
                        mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2
                        ${formData.deviceType === option.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white'}
                      `}>
                        {formData.deviceType === option.id && (
                          <div className="h-2.5 w-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {option.name}
                              {option.recommended && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Recommended
                                </span>
                              )}
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                            <ul className="mt-3 space-y-1">
                              {option.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-xs text-gray-500">
                                  <Shield className="w-3 h-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{option.price}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>

            {/* Router Model Selection (if applicable) */}
            {(formData.deviceType === "sim-router" || formData.deviceType === "router-upgrade") && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold mb-3">Select Router Model</h4>
                <RadioGroup 
                  value={formData.routerModel} 
                  onValueChange={(value) => handleInputChange("routerModel", value)}
                >
                  <div className="space-y-3">
                    {routerModels.map((model) => (
                      <label
                        key={model.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-white transition-colors
                          ${formData.routerModel === model.id ? 'border-orange-500 bg-white' : 'border-gray-200 bg-gray-50'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={model.id} />
                          <div>
                            <div className="font-medium text-sm">{model.name}</div>
                            <div className="text-xs text-gray-500">{model.specs}</div>
                          </div>
                        </div>
                        <div className="font-bold text-sm">
                          {model.price === 0 ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            `R${model.price}`
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Personal Details */}
        <TabsContent value="details" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <p className="text-sm text-gray-600 mb-6">
                We need your details to set up your account
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="John"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="082 123 4567"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange("idNumber", e.target.value)}
                  placeholder="Your South African ID number"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Required for RICA registration</p>
              </div>
            </div>

            {/* Contact Preferences */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Contact Preferences</h4>
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">
                    I accept the <a href="#" className="text-orange-500 hover:underline">Terms & Conditions</a> and <a href="#" className="text-orange-500 hover:underline">Privacy Policy</a>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.marketingAccepted}
                    onChange={(e) => handleInputChange("marketingAccepted", e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">
                    I'd like to receive promotional offers and updates from CircleTel
                  </span>
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Installation */}
        <TabsContent value="installation" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Installation Preference</h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose how you'd like to set up your service
              </p>
            </div>

            <RadioGroup 
              value={formData.installationType} 
              onValueChange={(value) => handleInputChange("installationType", value)}
            >
              <div className="space-y-4">
                <label className={`
                  flex cursor-pointer rounded-xl border p-4 hover:bg-gray-50 transition-colors
                  ${formData.installationType === "self" ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
                `}>
                  <RadioGroupItem value="self" className="sr-only" />
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`
                      mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2
                      ${formData.installationType === "self" ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white'}
                    `}>
                      {formData.installationType === "self" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Self Installation</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Easy plug-and-play setup with step-by-step guide
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Quick setup
                            </span>
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Online support
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">FREE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className={`
                  flex cursor-pointer rounded-xl border p-4 hover:bg-gray-50 transition-colors
                  ${formData.installationType === "professional" ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
                `}>
                  <RadioGroupItem value="professional" className="sr-only" />
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`
                      mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2
                      ${formData.installationType === "professional" ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white'}
                    `}>
                      {formData.installationType === "professional" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Professional Installation</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Expert technician setup at your location
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Scheduled visit
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Expert setup
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {packageId === "premium" ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              "R299"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>

            {/* Schedule Installation */}
            {formData.installationType === "professional" && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold mb-3">Schedule Installation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <select
                      id="preferredTime"
                      value={formData.preferredTime}
                      onChange={(e) => handleInputChange("preferredTime", e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select a time slot</option>
                      <option value="morning">Morning (8:00 - 12:00)</option>
                      <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                      <option value="evening">Evening (17:00 - 20:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Delivery Address */}
        <TabsContent value="address" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Delivery Address</h3>
              <p className="text-sm text-gray-600 mb-6">
                Where should we deliver your package?
              </p>
            </div>

            {/* Address Type */}
            <div>
              <Label>Address Type</Label>
              <RadioGroup 
                value={formData.addressType} 
                onValueChange={(value) => handleInputChange("addressType", value)}
                className="mt-2"
              >
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="residential" />
                    <span className="text-sm">Residential</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="business" />
                    <span className="text-sm">Business</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="suburb">Suburb</Label>
                  <Input
                    id="suburb"
                    value={formData.suburb}
                    onChange={(e) => handleInputChange("suburb", e.target.value)}
                    placeholder="Sandton"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Johannesburg"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province</Label>
                  <select
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleInputChange("province", e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Province</option>
                    <option value="gauteng">Gauteng</option>
                    <option value="western-cape">Western Cape</option>
                    <option value="kwazulu-natal">KwaZulu-Natal</option>
                    <option value="eastern-cape">Eastern Cape</option>
                    <option value="free-state">Free State</option>
                    <option value="limpopo">Limpopo</option>
                    <option value="mpumalanga">Mpumalanga</option>
                    <option value="north-west">North West</option>
                    <option value="northern-cape">Northern Cape</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="2000"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Have a referral code?</h4>
              <Input
                value={formData.referralCode}
                onChange={(e) => handleInputChange("referralCode", e.target.value)}
                placeholder="Enter referral code (optional)"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="p-6 bg-gray-50 rounded-b-xl border-t">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const tabs = ["device", "details", "installation", "address"]
              const currentIndex = tabs.indexOf(activeTab)
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1])
              }
            }}
            disabled={activeTab === "device"}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={activeTab === "details" && !formData.termsAccepted}
          >
            {activeTab === "address" ? (
              <>
                Proceed to Payment
                <CreditCard className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}