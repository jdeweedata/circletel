'use client'

import { useEffect } from 'react'
import { loadGoogleMapsService } from '@/lib/googleMapsLoader'

export function GoogleMapsPreloader() {
  useEffect(() => {
    // Preload Google Maps service when the component mounts
    loadGoogleMapsService().catch(console.error)
  }, [])

  // This component doesn't render anything
  return null
}