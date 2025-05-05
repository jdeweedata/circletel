
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PlanFeature = {
  included: boolean;
  name: string;
};

type PricingPlan = {
  name: string;
  price: number;
  devices: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
};

const PricingTables = () => {
  const smallBusinessPlans: PricingPlan[] = [
    {
      name: "Basic",
      price: 3250,
      devices: 5,
      description: "Essential IT support for small businesses",
      features: [
        { included: true, name: "Helpdesk Support" },
        { included: true, name: "Remote Monitoring" },
        { included: true, name: "Basic Security" },
        { included: false, name: "Advanced Security" },
        { included: false, name: "Strategic IT Planning" },
      ]
    },
    {
      name: "Growth",
      price: 6000,
      devices: 10,
      description: "Enhanced support for growing businesses",
      features: [
        { included: true, name: "Helpdesk Support" },
        { included: true, name: "Remote Monitoring" },
        { included: true, name: "Basic Security" },
        { included: true, name: "Cloud Solutions" },
        { included: false, name: "Strategic IT Planning" },
      ],
      popular: true
    },
    {
      name: "Secure",
      price: 9000,
      devices: 10,
      description: "Prioritizing security for smaller teams",
      features: [
        { included: true, name: "Helpdesk Support" },
        { included: true, name: "Remote Monitoring" },
        { included: true, name: "Advanced Security" },
        { included: true, name: "Cloud Solutions" },
        { included: true, name: "Compliance Support" },
      ]
    },
  ];

  const midSizePlans: PricingPlan[] = [
    {
      name: "Core",
      price: 17000,
      devices: 30,
      description: "Essential coverage for mid-size operations",
      features: [
        { included: true, name: "Priority Helpdesk" },
        { included: true, name: "Advanced Monitoring" },
        { included: true, name: "Enhanced Security" },
        { included: true, name: "Cloud Infrastructure" },
        { included: false, name: "Dedicated IT Manager" },
      ]
    },
    {
      name: "Advanced",
      price: 29500,
      devices: 50,
      description: "Comprehensive support for established firms",
      features: [
        { included: true, name: "Priority Helpdesk" },
        { included: true, name: "Advanced Monitoring" },
        { included: true, name: "Enhanced Security" },
        { included: true, name: "Cloud Infrastructure" },
        { included: true, name: "Disaster Recovery" },
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: 50000,
      devices: 75,
      description: "Full-scale IT management for larger teams",
      features: [
        { included: true, name: "24/7 Support" },
        { included: true, name: "Advanced Monitoring" },
        { included: true, name: "Enhanced Security" },
        { included: true, name: "Cloud Infrastructure" },
        { included: true, name: "Dedicated IT Manager" },
      ]
    },
  ];

  const growthReadyPlans: PricingPlan[] = [
    {
      name: "Startup",
      price: 6500,
      devices: 15,
      description: "Flexible IT for early-stage companies",
      features: [
        { included: true, name: "Responsive Support" },
        { included: true, name: "Scalable Infrastructure" },
        { included: true, name: "Basic Security" },
        { included: false, name: "Growth Planning" },
        { included: false, name: "Advanced Analytics" },
      ]
    },
    {
      name: "Scale",
      price: 13500,
      devices: 30,
      description: "Support for rapidly growing businesses",
      features: [
        { included: true, name: "Responsive Support" },
        { included: true, name: "Scalable Infrastructure" },
        { included: true, name: "Enhanced Security" },
        { included: true, name: "Growth Planning" },
        { included: false, name: "Advanced Analytics" },
      ],
      popular: true
    },
    {
      name: "Hypergrowth",
      price: 22000,
      devices: 40,
      description: "Advanced solutions for high-growth companies",
      features: [
        { included: true, name: "Priority Support" },
        { included: true, name: "Scalable Infrastructure" },
        { included: true, name: "Advanced Security" },
        { included: true, name: "Growth Planning" },
        { included: true, name: "Advanced Analytics" },
      ]
    },
  ];

  const PricingCard = ({ plan }: { plan: PricingPlan }) => (
    <Card className={`flex flex-col h-full border-2 ${plan.popular ? "border-circleTel-orange" : "border-gray-200"} shadow-md rounded-xl`}>
      {plan.popular && (
        <div className="bg-circleTel-orange text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader className={`${!plan.popular ? "pt-8" : "pt-4"}`}>
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-circleTel-secondaryNeutral">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <p className="text-3xl font-bold">R{plan.price.toLocaleString()}</p>
          <p className="text-sm text-circleTel-secondaryNeutral">per month</p>
        </div>
        <div className="text-sm mb-2 text-circleTel-secondaryNeutral font-medium">
          {plan.devices} devices included
        </div>
        <ul className="space-y-3 mt-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <div className="h-5 w-5 border border-gray-300 rounded-full mr-2" />
              )}
              <span className={feature.included ? "" : "text-gray-400"}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className={`w-full ${plan.popular 
            ? "bg-circleTel-orange hover:bg-circleTel-orange/90" 
            : "bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90"} text-white rounded-full`}
        >
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-circleTel-darkNeutral mb-12">
          Choose the Right Recipe for Your Business
        </h2>

        <Tabs defaultValue="small" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="small">Small Business</TabsTrigger>
              <TabsTrigger value="midsize">Mid-Size</TabsTrigger>
              <TabsTrigger value="growth">Growth-Ready</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="small" className="mt-0">
            <div className="grid md:grid-cols-3 gap-8">
              {smallBusinessPlans.map((plan, index) => (
                <PricingCard key={index} plan={plan} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="midsize" className="mt-0">
            <div className="grid md:grid-cols-3 gap-8">
              {midSizePlans.map((plan, index) => (
                <PricingCard key={index} plan={plan} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="growth" className="mt-0">
            <div className="grid md:grid-cols-3 gap-8">
              {growthReadyPlans.map((plan, index) => (
                <PricingCard key={index} plan={plan} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default PricingTables;
