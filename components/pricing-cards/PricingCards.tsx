'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Star } from 'lucide-react';

interface PlanOption {
  id: string;
  price: string;
  originalPrice?: string;
  speeds: {
    download: string;
    upload: string;
  };
  savings?: string;
  isSelected?: boolean;
  hasSpeedRestriction?: boolean;
}

interface PricingCardsProps {
  onPlanSelect?: (planId: string, planType: 'sim-only' | 'sim-router') => void;
  className?: string;
}

const PricingCards: React.FC<PricingCardsProps> = ({ onPlanSelect, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'sim-router' | 'sim-only'>('sim-only');
  const [selectedPlan, setSelectedPlan] = useState<string>('plan1');

  const simOnlyPlans: PlanOption[] = [
    {
      id: 'plan1',
      price: 'R389pm',
      originalPrice: 'R589pm',
      speeds: { download: '20Mbps', upload: '20Mbps' },
      savings: 'SAVE UP TO R300',
      isSelected: true
    },
    {
      id: 'plan2',
      price: 'R489pm',
      originalPrice: 'R889pm',
      speeds: { download: '30Mbps', upload: '30Mbps' },
      savings: 'SAVE UP TO R300'
    },
    {
      id: 'plan3',
      price: 'R599pm',
      originalPrice: 'R799pm',
      speeds: { download: '50Mbps', upload: '50Mbps' },
      savings: 'SAVE UP TO R300'
    },
    {
      id: 'plan4',
      price: 'R799pm',
      originalPrice: 'R1 099pm',
      speeds: { download: '', upload: '' },
      hasSpeedRestriction: true,
      savings: 'SAVE UP TO R300'
    }
  ];

  const simRouterPlans: PlanOption[] = [
    {
      id: 'router-plan1',
      price: 'R389pm',
      originalPrice: 'R689pm',
      speeds: { download: '20Mbps', upload: '20Mbps' },
      savings: 'SAVE UP TO R300',
      isSelected: true
    },
    {
      id: 'router-plan2',
      price: 'R489pm',
      originalPrice: 'R889pm',
      speeds: { download: '30Mbps', upload: '30Mbps' },
      savings: 'SAVE UP TO R300'
    },
    {
      id: 'router-plan3',
      price: 'R599pm',
      originalPrice: 'R799pm',
      speeds: { download: '50Mbps', upload: '50Mbps' },
      savings: 'SAVE UP TO R300'
    },
    {
      id: 'router-plan4',
      price: 'R799pm',
      originalPrice: 'R1 099pm',
      speeds: { download: '', upload: '' },
      hasSpeedRestriction: true,
      savings: 'SAVE UP TO R300'
    }
  ];

  const currentPlans = activeTab === 'sim-only' ? simOnlyPlans : simRouterPlans;

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onPlanSelect?.(planId, activeTab);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      <Card className="bg-white border-0 shadow-xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'sim-only' | 'sim-router')} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-none">
            <TabsTrigger value="sim-router" className="rounded-none font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
              SIM + New Router
            </TabsTrigger>
            <TabsTrigger value="sim-only" className="rounded-none font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              SIM Only
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 min-h-[600px]">
                <div className="bg-gray-50 p-8 lg:p-10">
                  <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-lg px-6 py-2 mb-6 font-bold tracking-wider">LTE</Badge>
                  <div className="mb-8 text-gray-700 text-base leading-relaxed">
                    {activeTab === 'sim-only' ? (
                      <p>Have your own router? No problem! Pick a SIM-only package to use with your router.</p>
                    ) : (
                      <p>Pay a once-off fee of R1519 for a premium LTE router to use with your monthly service.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {currentPlans.map((plan, index) => (
                      <Card
                        key={plan.id}
                        className={`relative cursor-pointer transition-all duration-200 ${
                          selectedPlan === plan.id
                            ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                            : 'hover:shadow-md hover:scale-102'
                        } ${
                          index === 0
                            ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                            : 'bg-white text-gray-800'
                        }`}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {plan.savings && (
                          <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            {plan.savings}
                          </Badge>
                        )}
                        <CardContent className="p-5">
                          <div className="text-xs mb-2 opacity-80">Uncapped</div>
                          <div className="text-xl font-bold mb-1">{plan.price}</div>
                          {plan.originalPrice && (
                            <div className="text-sm opacity-60 line-through mb-3">{plan.originalPrice}</div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            {plan.hasSpeedRestriction ? (
                              <span className="text-xs">No Speed Restriction</span>
                            ) : (
                              <>
                                <span>↓ {plan.speeds.download}</span>
                                <span>↑ {plan.speeds.upload}</span>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 lg:p-10 flex flex-col items-center justify-center">
                  <div className="w-32 h-16 mb-8 flex items-center justify-center">
                    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <ellipse cx="60" cy="30" rx="55" ry="25" fill="#FFCC00"/>
                      <text x="60" y="38" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#003366" textAnchor="middle">
                        MTN
                      </text>
                    </svg>
                  </div>

                  <div className="text-center mb-8">
                    <div className="text-gray-400 line-through text-lg mb-2">R589pm</div>
                    <div className="flex items-baseline justify-center gap-2 mb-3">
                      <span className="text-5xl font-bold text-gray-800">R389pm</span>
                      <span className="text-sm text-gray-500 font-normal">/ first 2 months</span>
                    </div>
                    <div className="flex justify-center gap-6 text-gray-600">
                      <span>↓ 20Mbps</span>
                      <span>↑ 20Mbps</span>
                    </div>
                  </div>

                  <div className="w-full mb-6">
                    <h3 className="text-pink-600 font-medium text-lg mb-4">What you get for free:</h3>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                      <span>SAVE for up to 2 months</span>
                      <span className="text-gray-400 cursor-pointer">ⓘ</span>
                    </div>
                  </div>

                  <details className="w-full mb-8">
                    <summary className="text-pink-600 font-medium text-lg cursor-pointer p-3 list-none flex items-center gap-2">
                      <span className="text-xs transition-transform">▼</span>
                      What else you should know:
                    </summary>
                    <div className="pt-4 text-gray-600 text-sm leading-relaxed">
                      <ul className="space-y-2">
                        <li>• No contract lock-in period</li>
                        <li>• Free SIM card delivery</li>
                        <li>• 24/7 customer support</li>
                        <li>• Data rollover available</li>
                      </ul>
                    </div>
                  </details>

                  <Button className="w-full max-w-sm bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold py-4 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                    Order Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default PricingCards;
