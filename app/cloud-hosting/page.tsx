"use client"

import React from 'react'
import CloudHeroSection from '@/components/cloud-hosting/CloudHeroSection'
import FeaturesBar from '@/components/cloud-hosting/FeaturesBar'
import TestimonialStats from '@/components/cloud-hosting/TestimonialStats'
import PricingTables from '@/components/cloud-hosting/PricingTables'
import PerformanceSection from '@/components/cloud-hosting/PerformanceSection'
import AwardsSection from '@/components/cloud-hosting/AwardsSection'
import { useCloudHostingData } from '@/hooks/useCloudHostingData'

export default function CloudHostingPage() {
  const { data, loading, error } = useCloudHostingData()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading content. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <CloudHeroSection data={data?.hero} />
      <FeaturesBar features={data?.features} />
      <TestimonialStats data={data?.testimonial} />
      <PricingTables plans={data?.pricingPlans} />
      <PerformanceSection data={data?.performance} />
      <AwardsSection awards={data?.awards} />
    </div>
  )
}