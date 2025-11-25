'use client';

/**
 * Browser Chrome Component
 *
 * Mockup browser window chrome for previewing pages
 * Shows address bar, navigation buttons, and protocol/domain
 */

import React from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock } from 'lucide-react';

interface BrowserChromeProps {
  children: React.ReactNode;
  url?: string;
}

export default function BrowserChrome({ children, url = 'www.circletel.co.za/page' }: BrowserChromeProps) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white">
      {/* Browser Header */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-3">
        {/* Window Controls + Navigation */}
        <div className="flex items-center gap-3 mb-3">
          {/* macOS Window Controls */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-1 ml-2">
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors" disabled>
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors" disabled>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors ml-1" disabled>
              <RotateCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Address Bar */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2">
          <Lock className="w-4 h-4 text-green-600" />
          <span className="text-sm text-gray-600 font-mono">https://</span>
          <span className="text-sm text-gray-900 font-mono flex-1">{url}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white overflow-auto max-h-[600px]">
        {children}
      </div>
    </div>
  );
}
