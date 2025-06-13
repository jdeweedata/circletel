import React from 'react';
import {
  WifiIcon,
  DeviceTabletIcon,
  SparklesIcon,
} from 'https://cdn.skypack.dev/@heroicons/react/24/outline?dts';

interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Card = ({ icon, title, description }: CardProps) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
    <div className="w-12 h-12 text-circleTel-orange mb-4">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-600 max-w-xs">{description}</p>
  </div>
);

const WhyMesh = () => (
  <section id="why-mesh" className="py-20 bg-circleTel-lightNeutral">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Why Mesh?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <Card
          icon={<WifiIcon className="w-full h-full" aria-hidden="true" />}
          title="No Dead Zones"
          description="Every corner of your home stays connected—even through walls and multiple floors."
        />
        <Card
          icon={<DeviceTabletIcon className="w-full h-full" aria-hidden="true" />}
          title="Connect 100+ Devices"
          description="Stream, work, and play on all your phones, TVs, consoles, and smart gadgets simultaneously."/>
        <Card
          icon={<SparklesIcon className="w-full h-full" aria-hidden="true" />}
          title="Future-proof Wi-Fi 6"
          description="Enjoy next-gen speeds up to 4.8 Gbps and capacity to handle tomorrow’s tech."/>
      </div>
    </div>
  </section>
);

export default WhyMesh;
