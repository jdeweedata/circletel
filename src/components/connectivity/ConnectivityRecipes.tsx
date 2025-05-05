
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiHigh, Circle, CircleCheck } from 'lucide-react';
import RecipeCard from '../ui/RecipeCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ConnectivityRecipes = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const recipes = [
    {
      id: 'waas',
      title: 'Wi-Fi as a Service (WaaS)',
      description: 'Seamless, secure Wi-Fi for employees and guests, no hardware hassles.',
      icon: <WifiHigh size={24} />,
      specs: [
        'Up to 1Gbps throughput',
        'Supports 50-500 devices',
        'Advanced security (firewalls, IDS/IPS)',
        '24/7 monitoring and management'
      ],
      proTips: [
        'Perfect for multi-location businesses',
        'Includes guest network with analytics',
        'No upfront hardware costs'
      ],
      pricing: 'ZAR 2,000/month (10 devices) to ZAR 10,000/month (100 devices)',
      link: '/connectivity/wifi-as-a-service',
      type: 'wifi'
    },
    {
      id: 'fwa',
      title: 'Fixed Wireless Access (FWA)',
      description: 'Fast, flexible internet for areas without fibre, deployed in days.',
      icon: <Circle size={24} />,
      specs: [
        '10-100Mbps throughput',
        '<20ms latency',
        'Scalable bandwidth',
        'Quick deployment (2-5 days)'
      ],
      proTips: [
        'Ideal for locations without fibre',
        'No trenching or construction required',
        'Easily relocatable when you move'
      ],
      pricing: 'ZAR 1,500/month (10Mbps) to ZAR 5,000/month (100Mbps)',
      link: '/connectivity/fixed-wireless',
      type: 'wireless'
    },
    {
      id: 'fttp',
      title: 'Fibre to the Premises (FTTP)',
      description: 'Blazing-fast, reliable connectivity for critical applications.',
      icon: <CircleCheck size={24} />,
      specs: [
        '50Mbps-1Gbps throughput',
        '<5ms latency',
        'Free router included',
        'Uncapped/unshaped bandwidth'
      ],
      proTips: [
        'Best option for bandwidth-intensive applications',
        'Includes VoIP integration capability',
        'Symmetrical upload/download options available'
      ],
      pricing: 'ZAR 3,000/month (50Mbps) to ZAR 15,000/month (1Gbps)',
      link: '/connectivity/fibre',
      type: 'fibre'
    }
  ];
  
  const filteredRecipes = activeFilter === 'all' 
    ? recipes 
    : recipes.filter(recipe => recipe.type === activeFilter);
    
  return (
    <section id="recipes-section" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">
          Our Connectivity Recipes
        </h2>
        
        <div className="flex justify-center mb-8">
          <Tabs defaultValue="all" className="w-full max-w-md">
            <TabsList className="grid grid-cols-4 rounded-full bg-circleTel-lightNeutral">
              <TabsTrigger 
                value="all" 
                className="rounded-full data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                onClick={() => setActiveFilter('all')}
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="wifi" 
                className="rounded-full data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                onClick={() => setActiveFilter('wifi')}
              >
                Wi-Fi
              </TabsTrigger>
              <TabsTrigger 
                value="wireless" 
                className="rounded-full data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                onClick={() => setActiveFilter('wireless')}
              >
                Wireless
              </TabsTrigger>
              <TabsTrigger 
                value="fibre" 
                className="rounded-full data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                onClick={() => setActiveFilter('fibre')}
              >
                Fibre
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    title={recipe.title}
                    description={recipe.description}
                    icon={recipe.icon}
                    specs={recipe.specs}
                    proTips={recipe.proTips}
                    link={recipe.link}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="wifi" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    title={recipe.title}
                    description={recipe.description}
                    icon={recipe.icon}
                    specs={recipe.specs}
                    proTips={recipe.proTips}
                    link={recipe.link}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="wireless" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    title={recipe.title}
                    description={recipe.description}
                    icon={recipe.icon}
                    specs={recipe.specs}
                    proTips={recipe.proTips}
                    link={recipe.link}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="fibre" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    title={recipe.title}
                    description={recipe.description}
                    icon={recipe.icon}
                    specs={recipe.specs}
                    proTips={recipe.proTips}
                    link={recipe.link}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="text-center mt-10">
          <Button asChild className="primary-button">
            <Link to="/resources/it-health">Get Your Connectivity Assessment</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ConnectivityRecipes;
