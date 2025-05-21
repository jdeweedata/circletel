
import React from 'react';
import { CheckCircle } from 'lucide-react';

const WifiBenefits = () => {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-12">
          Business Benefits of Wi-Fi as a Service
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
              <CheckCircle className="text-circleTel-orange mr-2" size={20} />
              Predictable Monthly Costs
            </h3>
            <p className="text-circleTel-secondaryNeutral ml-8">
              No upfront equipment purchases or surprise maintenance costs. One simple monthly fee covers everything.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
              <CheckCircle className="text-circleTel-orange mr-2" size={20} />
              Always Up-to-Date Technology
            </h3>
            <p className="text-circleTel-secondaryNeutral ml-8">
              Hardware refreshes are included in your subscription, ensuring you always have modern, high-performance equipment.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
              <CheckCircle className="text-circleTel-orange mr-2" size={20} />
              Reduced IT Burden
            </h3>
            <p className="text-circleTel-secondaryNeutral ml-8">
              Your team can focus on core business activities while we manage all aspects of your Wi-Fi infrastructure.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-circleTel-darkNeutral flex items-center mb-4">
              <CheckCircle className="text-circleTel-orange mr-2" size={20} />
              Enhanced Productivity
            </h3>
            <p className="text-circleTel-secondaryNeutral ml-8">
              Reliable connectivity means your team spends less time troubleshooting and more time being productive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WifiBenefits;
