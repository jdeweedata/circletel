import React, { useState } from 'react';
import LeadMagnetForm from './LeadMagnetForm';
import LeadMagnetSuccess from './LeadMagnetSuccess';
import SampleItReport from './SampleItReport';
import RegisterInterestForm from '../common/RegisterInterestForm';
import { Button } from '@/components/ui/button';

const LeadMagnet = () => {
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');

  const handleSuccess = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-circleTel-lightNeutral to-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Get Your Free South African IT Health Recipe</h2>
              <p className="text-circleTel-secondaryNeutral mb-6">
                Discover how well your IT infrastructure is performing in the face of South African challenges like load shedding and connectivity issues. Get a customized recipe for improvement tailored to your business.
              </p>
              
              {/* Benefits List - New Addition */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-3">What You'll Get:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Load shedding preparedness assessment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Security vulnerability report</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Personalized cost-saving recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">✓</span>
                    <span className="text-circleTel-secondaryNeutral">Customized IT roadmap for growth</span>
                  </li>
                </ul>
              </div>
              
              {/* Social Proof - New Addition */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <p className="text-circleTel-secondaryNeutral italic">
                  "The IT assessment helped us identify critical gaps in our load shedding strategy. We implemented CircleTel's recommendations and now our business continues operating even during Stage 6!"
                </p>
                <div className="flex items-center mt-3">
                  <div className="h-10 w-10 rounded-full bg-circleTel-lightNeutral flex items-center justify-center text-circleTel-orange font-bold">
                    JM
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-circleTel-darkNeutral">Johan Malan</p>
                    <p className="text-xs text-circleTel-secondaryNeutral">Cape Town Retail, Owner</p>
                  </div>
                </div>
              </div>
              
              {/* Sample Report Component */}
              <SampleItReport />
            </div>
            
            <div>
              {/* Tab Navigation */}
              <div className="flex mb-6">
                <button 
                  className={`flex-1 py-2 px-4 text-center font-medium ${activeTab === 'assessment' ? 'border-b-2 border-circleTel-orange text-circleTel-darkNeutral' : 'text-circleTel-secondaryNeutral'}`}
                  onClick={() => setActiveTab('assessment')}
                >
                  IT Assessment
                </button>
                <button 
                  className={`flex-1 py-2 px-4 text-center font-medium ${activeTab === 'interest' ? 'border-b-2 border-circleTel-orange text-circleTel-darkNeutral' : 'text-circleTel-secondaryNeutral'}`}
                  onClick={() => setActiveTab('interest')}
                >
                  Future Services
                </button>
                <button 
                  className={`flex-1 py-2 px-4 text-center font-medium ${activeTab === 'loadshedding' ? 'border-b-2 border-circleTel-orange text-circleTel-darkNeutral' : 'text-circleTel-secondaryNeutral'}`}
                  onClick={() => setActiveTab('loadshedding')}
                >
                  Load Shedding
                </button>
              </div>
              
              {/* Tab Content */}
              {activeTab === 'assessment' ? (
                !submitted ? (
                  <LeadMagnetForm onSuccess={handleSuccess} />
                ) : (
                  <LeadMagnetSuccess onReset={handleReset} />
                )
              ) : activeTab === 'interest' ? (
                <RegisterInterestForm />
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Load Shedding Solutions</h3>
                  <p className="text-circleTel-secondaryNeutral mb-4">
                    Keep your business running during power outages with our specialized IT solutions for load shedding.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">1</span>
                      <span className="text-circleTel-secondaryNeutral">Backup power systems with UPS</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">2</span>
                      <span className="text-circleTel-secondaryNeutral">Cloud backup & recovery</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full bg-circleTel-orange text-white flex items-center justify-center mr-2 mt-0.5">3</span>
                      <span className="text-circleTel-secondaryNeutral">Redundant connectivity options</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
                    onClick={() => window.location.href = '/resources/load-shedding'}
                  >
                    Learn More About Our Solutions
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadMagnet;
