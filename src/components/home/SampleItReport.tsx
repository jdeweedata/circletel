
import React from 'react';

const SampleItReport: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-circleTel-orange p-6 shadow-md relative mb-8 md:mb-0">
      <div className="absolute -top-4 -right-4 bg-circleTel-orange text-white text-sm font-space-mono py-1 px-3 rounded-lg">
        SAMPLE REPORT
      </div>
      
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">IT Health Assessment</h3>
      <div className="bg-circleTel-lightNeutral h-1 w-16 mb-4"></div>
      
      <div className="flex items-center mb-3">
        <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Security Score:</div>
        <div className="w-2/3 bg-gray-200 rounded-full h-4">
          <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '70%' }}></div>
        </div>
      </div>
      
      <div className="flex items-center mb-3">
        <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Efficiency:</div>
        <div className="w-2/3 bg-gray-200 rounded-full h-4">
          <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '60%' }}></div>
        </div>
      </div>
      
      <div className="flex items-center mb-3">
        <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Reliability:</div>
        <div className="w-2/3 bg-gray-200 rounded-full h-4">
          <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '85%' }}></div>
        </div>
      </div>
      
      <div className="flex items-center mb-4">
        <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Scalability:</div>
        <div className="w-2/3 bg-gray-200 rounded-full h-4">
          <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '50%' }}></div>
        </div>
      </div>
      
      <div className="font-space-mono text-xs text-circleTel-secondaryNeutral mb-2">KEY FINDINGS:</div>
      <ul className="text-sm text-circleTel-secondaryNeutral space-y-1 mb-4">
        <li className="flex items-start">
          <span className="mr-2">•</span>
          Outdated firewall needs immediate upgrade
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          Email security lacking phishing protection
        </li>
        <li className="flex items-start">
          <span className="mr-2">•</span>
          Backup strategy needs improvement
        </li>
      </ul>
      
      {/* Network-themed decoration */}
      <div className="absolute bottom-4 right-4 w-16 h-16 opacity-10">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-3/4 left-3/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-1/4 left-3/4 w-1 h-1 bg-circleTel-orange rounded-full"></div>
        <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-circleTel-orange rounded-full"></div>
      </div>
    </div>
  );
};

export default SampleItReport;
