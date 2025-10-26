'use client';

import React from 'react';
import Link from 'next/link';

export function SlimFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          {/* Copyright */}
          <div className="flex items-center gap-2">
            <span>© {currentYear} CircleTel</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">All rights reserved</span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <Link 
              href="/privacy-policy" 
              className="hover:text-circleTel-orange transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-of-service" 
              className="hover:text-circleTel-orange transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact" 
              className="hover:text-circleTel-orange transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-1 text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure & POPIA compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
