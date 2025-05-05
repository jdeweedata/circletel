
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check } from 'lucide-react';

interface ComparisonFeature {
  name: string;
  small: {
    basic: boolean;
    growth: boolean;
    secure: boolean;
  };
  midSize: {
    core: boolean;
    advanced: boolean;
    enterprise: boolean;
  };
  growthReady: {
    startup: boolean;
    scale: boolean;
    hypergrowth: boolean;
  };
  category: string;
}

const PricingComparison = () => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['all']);
  
  const features: ComparisonFeature[] = [
    {
      name: "Helpdesk Support",
      small: { basic: true, growth: true, secure: true },
      midSize: { core: true, advanced: true, enterprise: true },
      growthReady: { startup: true, scale: true, hypergrowth: true },
      category: "support"
    },
    {
      name: "Remote Monitoring",
      small: { basic: true, growth: true, secure: true },
      midSize: { core: true, advanced: true, enterprise: true },
      growthReady: { startup: true, scale: true, hypergrowth: true },
      category: "monitoring"
    },
    {
      name: "Basic Security",
      small: { basic: true, growth: true, secure: false },
      midSize: { core: false, advanced: false, enterprise: false },
      growthReady: { startup: true, scale: false, hypergrowth: false },
      category: "security"
    },
    {
      name: "Advanced Security",
      small: { basic: false, growth: false, secure: true },
      midSize: { core: true, advanced: true, enterprise: true },
      growthReady: { startup: false, scale: true, hypergrowth: true },
      category: "security"
    },
    {
      name: "Cloud Infrastructure",
      small: { basic: false, growth: true, secure: true },
      midSize: { core: true, advanced: true, enterprise: true },
      growthReady: { startup: true, scale: true, hypergrowth: true },
      category: "cloud"
    },
    {
      name: "Strategic Planning",
      small: { basic: false, growth: false, secure: true },
      midSize: { core: true, advanced: true, enterprise: true },
      growthReady: { startup: false, scale: true, hypergrowth: true },
      category: "planning"
    },
    {
      name: "Dedicated IT Manager",
      small: { basic: false, growth: false, secure: false },
      midSize: { core: false, advanced: false, enterprise: true },
      growthReady: { startup: false, scale: false, hypergrowth: false },
      category: "support"
    },
    {
      name: "Compliance Support",
      small: { basic: false, growth: false, secure: true },
      midSize: { core: false, advanced: true, enterprise: true },
      growthReady: { startup: false, scale: false, hypergrowth: true },
      category: "compliance"
    },
    {
      name: "24/7 Support",
      small: { basic: false, growth: false, secure: false },
      midSize: { core: false, advanced: false, enterprise: true },
      growthReady: { startup: false, scale: false, hypergrowth: false },
      category: "support"
    },
    {
      name: "Disaster Recovery",
      small: { basic: false, growth: false, secure: false },
      midSize: { core: false, advanced: true, enterprise: true },
      growthReady: { startup: false, scale: true, hypergrowth: true },
      category: "security"
    },
  ];

  const categories = [
    { id: "all", name: "All Features" },
    { id: "support", name: "Support" },
    { id: "security", name: "Security" },
    { id: "monitoring", name: "Monitoring" },
    { id: "cloud", name: "Cloud Services" },
    { id: "planning", name: "Planning" },
    { id: "compliance", name: "Compliance" },
  ];

  const toggleCategory = (category: string) => {
    if (category === 'all') {
      setSelectedFeatures(['all']);
      return;
    }
    
    const newSelection = selectedFeatures.includes('all') 
      ? [category]
      : selectedFeatures.includes(category)
        ? selectedFeatures.filter(f => f !== category)
        : [...selectedFeatures, category];
        
    if (newSelection.length === 0) {
      setSelectedFeatures(['all']);
    } else {
      setSelectedFeatures(newSelection);
    }
  };

  const filteredFeatures = features.filter(feature => 
    selectedFeatures.includes('all') || selectedFeatures.includes(feature.category)
  );

  return (
    <section className="py-16 bg-circleTel-lightNeutral/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-8">
          Compare Our IT Recipes
        </h2>
        
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedFeatures.includes(category.id) || (category.id === 'all' && selectedFeatures.includes('all'))
                  ? 'bg-circleTel-orange text-white'
                  : 'bg-white text-circleTel-darkNeutral border border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-circleTel-darkNeutral">
                <TableRow>
                  <TableHead className="text-white">Features</TableHead>
                  <TableHead className="text-white text-center" colSpan={3}>Small Business</TableHead>
                  <TableHead className="text-white text-center" colSpan={3}>Mid-Size Business</TableHead>
                  <TableHead className="text-white text-center" colSpan={3}>Growth-Ready</TableHead>
                </TableRow>
                <TableRow className="bg-circleTel-darkNeutral/90">
                  <TableHead className="text-white"></TableHead>
                  <TableHead className="text-white text-center">Basic</TableHead>
                  <TableHead className="text-white text-center">Growth</TableHead>
                  <TableHead className="text-white text-center">Secure</TableHead>
                  <TableHead className="text-white text-center">Core</TableHead>
                  <TableHead className="text-white text-center">Advanced</TableHead>
                  <TableHead className="text-white text-center">Enterprise</TableHead>
                  <TableHead className="text-white text-center">Startup</TableHead>
                  <TableHead className="text-white text-center">Scale</TableHead>
                  <TableHead className="text-white text-center">Hypergrowth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.map((feature, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    <TableCell className="text-center">
                      {feature.small.basic && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.small.growth && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.small.secure && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.midSize.core && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.midSize.advanced && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.midSize.enterprise && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.growthReady.startup && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.growthReady.scale && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {feature.growthReady.hypergrowth && <Check className="h-5 w-5 text-green-500 mx-auto" />}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>Monthly Price</TableCell>
                  <TableCell className="text-center">R3,250</TableCell>
                  <TableCell className="text-center">R6,000</TableCell>
                  <TableCell className="text-center">R9,000</TableCell>
                  <TableCell className="text-center">R17,000</TableCell>
                  <TableCell className="text-center">R29,500</TableCell>
                  <TableCell className="text-center">R50,000</TableCell>
                  <TableCell className="text-center">R6,500</TableCell>
                  <TableCell className="text-center">R13,500</TableCell>
                  <TableCell className="text-center">R22,000</TableCell>
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell>Devices</TableCell>
                  <TableCell className="text-center">5</TableCell>
                  <TableCell className="text-center">10</TableCell>
                  <TableCell className="text-center">10</TableCell>
                  <TableCell className="text-center">30</TableCell>
                  <TableCell className="text-center">50</TableCell>
                  <TableCell className="text-center">75</TableCell>
                  <TableCell className="text-center">15</TableCell>
                  <TableCell className="text-center">30</TableCell>
                  <TableCell className="text-center">40</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
