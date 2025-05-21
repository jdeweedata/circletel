
import React, { useState } from 'react';
import LeadMagnetForm from './LeadMagnetForm';
import LeadMagnetSuccess from './LeadMagnetSuccess';
import SampleItReport from './SampleItReport';
import RegisterInterestForm from '../common/RegisterInterestForm';

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
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Get Your Free IT Health Recipe</h2>
              <p className="text-circleTel-secondaryNeutral mb-6">
                Discover how well your IT infrastructure is performing and get a customized recipe for improvement. 
                Our IT assessment will identify vulnerabilities, inefficiencies, and opportunities.
              </p>
              
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
              </div>
              
              {/* Tab Content */}
              {activeTab === 'assessment' ? (
                !submitted ? (
                  <LeadMagnetForm onSuccess={handleSuccess} />
                ) : (
                  <LeadMagnetSuccess onReset={handleReset} />
                )
              ) : (
                <RegisterInterestForm />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadMagnet;
