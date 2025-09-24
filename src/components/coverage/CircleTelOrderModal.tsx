import React, { useState } from 'react';
import { X, ChevronLeft, Shield, Wifi, CheckCircle, Clock, Phone, Building2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import clsx from 'clsx';

interface OrderStep {
  step: number;
  title: string;
  component: React.ReactNode;
}

interface ServicePackage {
  id: string;
  name: string;
  technology: 'FIBRE' | 'FIXED_WIRELESS' | 'LTE';
  provider: string;
  speed: string;
  price: number;
  originalPrice?: number;
  installation: number;
  originalInstallation?: number;
  router: number;
  originalRouter?: number;
  contract: number;
  features: string[];
  available: boolean;
  isRecommended?: boolean;
  promotionalOffer?: {
    freeInstallation: boolean;
    freeRouter: boolean;
    discountedPrice?: number;
    validUntil?: string;
  };
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: 'connectivity' | 'router' | 'backup' | 'support';
  icon: React.ComponentType<{ className?: string }>;
  isFree?: boolean;
  isPopular?: boolean;
}

interface CustomerInfo {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  customAddress: string;
}

interface OrderData {
  package: ServicePackage;
  addOns: (AddOn | undefined)[];
  customerDetails: CustomerDetails;
  customerInfo?: CustomerInfo;
  total: number;
  savings: number;
}

interface CircleTelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: ServicePackage;
  availableAddOns?: AddOn[];
  customerInfo?: CustomerInfo;
  onOrderComplete: (orderData: OrderData) => void;
}

const TECHNOLOGY_CONFIG = {
  'FIBRE': {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Zap,
    label: 'Fibre',
  },
  'FIXED_WIRELESS': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Wifi,
    label: 'SkyFibre',
  },
  'LTE': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Building2,
    label: '4G/5G',
  }
} as const;

const DEFAULT_ADDONS: AddOn[] = [
  {
    id: 'skyfibre-max',
    name: 'SkyFibre Max',
    description: 'Never go down again. Get LTE failover within 5 minutes.',
    price: 499,
    category: 'connectivity',
    icon: Wifi,
    isPopular: true
  },
  {
    id: 'premium-router',
    name: 'Premium WiFi Router',
    description: 'Get a FREE WiFi router with our promotion.',
    price: 0,
    originalPrice: 899,
    category: 'router',
    icon: Wifi,
    isFree: true
  },
  {
    id: 'mesh-system',
    name: 'Mesh WiFi System',
    description: '3-Pack WiFi mesh system for whole-home coverage.',
    price: 2999,
    category: 'router',
    icon: Wifi
  },
  {
    id: 'ups-backup',
    name: 'UPS Backup Power',
    description: '8800mAh UPS can power your connection during load-shedding.',
    price: 999,
    category: 'backup',
    icon: Shield
  }
];

export const CircleTelOrderModal: React.FC<CircleTelOrderModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  availableAddOns = DEFAULT_ADDONS,
  customerInfo,
  onOrderComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    customAddress: ''
  });

  if (!isOpen) return null;

  const techConfig = TECHNOLOGY_CONFIG[selectedPackage.technology];
  const TechIcon = techConfig.icon;

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    const packagePrice = selectedPackage.price;
    const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    return packagePrice + addOnTotal;
  };

  const getPromotionalSavings = () => {
    let savings = 0;
    if (selectedPackage.promotionalOffer?.freeInstallation && selectedPackage.originalInstallation) {
      savings += selectedPackage.originalInstallation;
    }
    if (selectedPackage.promotionalOffer?.freeRouter && selectedPackage.originalRouter) {
      savings += selectedPackage.originalRouter;
    }
    selectedAddOns.forEach(addOnId => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      if (addOn?.originalPrice && addOn.price < addOn.originalPrice) {
        savings += addOn.originalPrice - addOn.price;
      }
    });
    return savings;
  };

  const steps: OrderStep[] = [
    {
      step: 1,
      title: 'Installation Details',
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Installation Details</h3>
            <p className="text-sm text-muted-foreground">
              Please provide your installation details for our technicians
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Line Location Details
              </h4>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{customerInfo?.address || '3rd Rd'}</p>
                    <button className="text-sm text-circleTel-orange hover:underline">
                      Change Address
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Location Type</label>
                  <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                    <option>Freestanding Home</option>
                    <option>Apartment</option>
                    <option>Townhouse</option>
                    <option>Business Premises</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Street Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="Enter street number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">
                    Custom name for this address (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="e.g., Home Office, Main Building"
                    value={customerDetails.customAddress}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, customAddress: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Installation Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Installation Details
              </h4>

              <div>
                <label className="block text-sm font-medium mb-1">Order Type</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option>New Installation</option>
                  <option>Upgrade Existing</option>
                  <option>Transfer Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone number of contact for installation
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="0732288016"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  Alternate contact number for installation
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Optional backup number"
                  value={customerDetails.alternatePhone}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, alternatePhone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 2,
      title: 'Add-on Services',
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Helpful add-ons</h3>
            <p className="text-sm text-muted-foreground">
              Enhance your connection with these optional services
            </p>
          </div>

          <div className="space-y-4">
            {availableAddOns.map(addOn => {
              const isSelected = selectedAddOns.includes(addOn.id);
              const AddOnIcon = addOn.icon;

              return (
                <Card
                  key={addOn.id}
                  className={clsx(
                    'cursor-pointer transition-all hover:shadow-md',
                    isSelected && 'ring-2 ring-circleTel-orange bg-orange-50'
                  )}
                  onClick={() => toggleAddOn(addOn.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <AddOnIcon className="h-6 w-6 text-gray-600" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{addOn.name}</h4>
                            {addOn.isPopular && (
                              <Badge className="bg-circleTel-orange text-white text-xs">
                                POPULAR
                              </Badge>
                            )}
                            {addOn.isFree && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                FREE
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{addOn.description}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        {addOn.isFree ? (
                          <div>
                            <div className="text-lg font-bold text-green-600">FREE</div>
                            {addOn.originalPrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                R{addOn.originalPrice}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-circleTel-orange">
                            R{addOn.price} pm
                          </div>
                        )}

                        <div className="flex items-center justify-end mt-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAddOn(addOn.id)}
                            className="w-4 h-4 text-circleTel-orange bg-gray-100 border-gray-300 rounded focus:ring-circleTel-orange focus:ring-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedAddOns.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-800 mb-2">Selected Add-ons</h4>
                <ul className="space-y-1">
                  {selectedAddOns.map(addOnId => {
                    const addOn = availableAddOns.find(a => a.id === addOnId);
                    return addOn ? (
                      <li key={addOnId} className="flex justify-between text-sm">
                        <span>{addOn.name}</span>
                        <span className="font-medium">
                          {addOn.isFree ? 'FREE' : `R${addOn.price} pm`}
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      step: 3,
      title: 'Payment Method',
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Payment method</h3>
            <Button variant="outline" size="sm" className="mb-4">
              + Add payment method
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Cheque *867</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wide">
                    STANDARD BANK SA LTD
                  </div>
                  <div className="text-sm text-muted-foreground">
                    CircleTel Business Services
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h4 className="font-semibold">Customer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Enter your full name"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="your.email@example.com"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep - 1];
  const isLastStep = currentStep === steps.length;
  const canProceed = currentStep === 1 ? customerDetails.phone :
                    currentStep === 2 ? true :
                    customerDetails.name && customerDetails.email;

  const handleNext = () => {
    if (isLastStep) {
      // Complete order
      const orderData = {
        package: selectedPackage,
        addOns: selectedAddOns.map(id => availableAddOns.find(a => a.id === id)),
        customerDetails,
        customerInfo,
        total: calculateTotal(),
        savings: getPromotionalSavings()
      };
      onOrderComplete(orderData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6" />
            <span className="text-sm font-medium uppercase tracking-wide">Secure Signup</span>
          </div>

          <h1 className="text-2xl font-bold">{currentStepData.title}</h1>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index + 1 <= currentStep ? 'bg-white text-teal-600' : 'bg-teal-400 text-white'
                )}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={clsx(
                    'w-4 h-0.5 mx-1',
                    index + 1 < currentStep ? 'bg-white' : 'bg-teal-400'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {currentStepData.component}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          {/* Package Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={techConfig.color}>
                  <TechIcon className="h-3 w-3 mr-1" />
                  {techConfig.label}
                </Badge>
                <span className="font-semibold">{selectedPackage.name}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">R{calculateTotal()} pm</div>
                {getPromotionalSavings() > 0 && (
                  <div className="text-sm text-green-600">
                    You save R{getPromotionalSavings()}
                  </div>
                )}
              </div>
            </div>

            {/* Promotional Benefits Bar */}
            {selectedPackage.promotionalOffer && (
              <div className="flex items-center justify-center gap-8 py-4 border-t border-gray-200 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    INSTALLATION {selectedPackage.promotionalOffer.freeInstallation ? 'FREE' : 'INCL.'}
                  </span>
                  {selectedPackage.promotionalOffer.freeInstallation && (
                    <span className="text-xs text-muted-foreground">
                      (Save R{selectedPackage.originalInstallation})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">ACTIVATION INCL.</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    WIFI ROUTER {selectedPackage.promotionalOffer.freeRouter ? 'FREE' : 'INCL.'}
                  </span>
                  {selectedPackage.promotionalOffer.freeRouter && (
                    <span className="text-xs text-muted-foreground">
                      (Save R{selectedPackage.originalRouter})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* T&C Notice */}
            {(selectedPackage.promotionalOffer?.freeInstallation || selectedPackage.promotionalOffer?.freeRouter) && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                FREE promotion valid until {selectedPackage.promotionalOffer?.validUntil || 'end of month'}. T&C's apply.
                <button className="text-circleTel-orange hover:underline ml-1">View terms</button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : onClose()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
            >
              {isLastStep ? 'Complete Order' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};