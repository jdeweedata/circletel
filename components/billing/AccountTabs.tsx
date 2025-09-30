'use client';

import { useState } from 'react';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'billing', label: 'Billing', active: true },
  { id: 'services', label: 'Services' },
  { id: 'support', label: 'Support' },
  { id: 'settings', label: 'Settings' }
];

export default function AccountTabs() {
  const [activeTab, setActiveTab] = useState('billing');

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-circleTel-orange text-circleTel-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}