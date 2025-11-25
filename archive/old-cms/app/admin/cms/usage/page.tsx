'use client'

/**
 * CMS AI Usage Monitoring Page
 *
 * Displays comprehensive AI usage statistics, rate limits, and cost tracking
 * Accessible at /admin/cms/usage
 */

import React from 'react'
import Link from 'next/link'
import UsageMonitoringDashboard from '@/components/cms/UsageMonitoringDashboard'

export default function CMSUsagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link href="/admin/cms" className="hover:text-circleTel-orange transition-colors">
                  CMS
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">AI Usage Monitoring</span>
              </div>
              <h1 className="text-3xl font-bold text-circleTel-darkNeutral">AI Usage & Rate Limits</h1>
              <p className="mt-2 text-gray-600">
                Track your AI content generation usage, costs, and rate limits
              </p>
            </div>
            <Link
              href="/admin/cms"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UsageMonitoringDashboard />
      </div>
    </div>
  )
}
