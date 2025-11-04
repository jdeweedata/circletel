import { useState, useEffect } from 'react'

interface CloudHostingData {
  hero: {
    title: string
    subtitle: string
    backgroundImage?: {
      url: string
    }
  }
  features: Array<{
    icon: string
    title: string
    description: string
  }>
  testimonial: {
    statNumber: string
    statText: string
    testimonialText: string
    testimonialAuthor: string
    testimonialRole: string
  }
  pricingPlans: Array<{
    planType: 'managed' | 'self-managed'
    title: string
    description: string
    tiers: Array<{
      name: string
      cpu: string
      ram: string
      storage: string
      bandwidth: string
      price: number
      priceLabel: string
      isPopular?: boolean
    }>
  }>
  performance: {
    title: string
    subtitle: string
    description: string
    features: Array<{
      title: string
      description: string
    }>
  }
  awards: Array<{
    title: string
    description: string
    year?: string
    icon?: {
      url: string
    }
  }>
}

export function useCloudHostingData() {
  const [data, setData] = useState<CloudHostingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cloud-hosting')
        
        if (!response.ok) {
          // Use default data if API fails
          setData(getDefaultData())
          setLoading(false)
          return
        }

        const result = await response.json()
        setData(result.data || getDefaultData())
      } catch (err) {
        console.error('Error fetching cloud hosting data:', err)
        // Use default data on error
        setData(getDefaultData())
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}

function getDefaultData(): CloudHostingData {
  return {
    hero: {
      title: 'Cloud Hosting.',
      subtitle: 'Virtual hosting with more scalability, more redundancy and minimal downtime.'
    },
    features: [
      {
        icon: 'database',
        title: 'Top-tier data centres',
        description: 'Enterprise-grade infrastructure'
      },
      {
        icon: 'settings',
        title: 'Scalable',
        description: 'Grow as you need'
      },
      {
        icon: 'users',
        title: 'Customisable',
        description: 'Tailored to your needs'
      },
      {
        icon: 'clock',
        title: 'Malware switches',
        description: 'Advanced security'
      }
    ],
    testimonial: {
      statNumber: '58 315',
      statText: 'people just like you use ISP in South Africa',
      testimonialText: 'Managed VPS/Servers! Unrivalled support, availability and consistency! What more could a web agency need! CircleTel has been a cornerstone in our growth and development, and our clients absolutely love them!',
      testimonialAuthor: 'TechAgent CEO',
      testimonialRole: 'Digital Solutions Provider'
    },
    pricingPlans: [
      {
        planType: 'self-managed',
        title: 'Self-managed',
        description: 'Full control over your cloud infrastructure',
        tiers: [
          { name: 'Silver Pro', cpu: '2x2', ram: '2 GB', storage: '40GB SSD', bandwidth: 'Unmetered', price: 195, priceLabel: 'R195 p/m' },
          { name: 'Gold', cpu: '3x3', ram: '3 GB', storage: '60GB SSD', bandwidth: 'Unmetered', price: 295, priceLabel: 'R295 p/m', isPopular: true },
          { name: 'Gold Pro', cpu: '4x4', ram: '4 GB', storage: '80GB SSD', bandwidth: 'Unmetered', price: 395, priceLabel: 'R395 p/m' },
          { name: 'Platinum', cpu: '6x6', ram: '6 GB', storage: '120GB SSD', bandwidth: 'Unmetered', price: 595, priceLabel: 'R595 p/m' },
          { name: 'Platinum Pro', cpu: '8x8', ram: '8 GB', storage: '160GB SSD', bandwidth: 'Unmetered', price: 795, priceLabel: 'R795 p/m' }
        ]
      },
      {
        planType: 'managed',
        title: 'Managed',
        description: 'We handle everything for you',
        tiers: [
          { name: 'Managed 1', cpu: '2x2', ram: '2 GB', storage: '40GB SSD', bandwidth: 'Unmetered', price: 495, priceLabel: 'R495 p/m' },
          { name: 'Managed 2', cpu: '3x3', ram: '3 GB', storage: '60GB SSD', bandwidth: 'Unmetered', price: 695, priceLabel: 'R695 p/m', isPopular: true },
          { name: 'Managed 3', cpu: '4x4', ram: '4 GB', storage: '80GB SSD', bandwidth: 'Unmetered', price: 895, priceLabel: 'R895 p/m' },
          { name: 'Managed 4', cpu: '6x6', ram: '6 GB', storage: '120GB SSD', bandwidth: 'Unmetered', price: 1295, priceLabel: 'R1,295 p/m' },
          { name: 'Managed 5', cpu: '8x8', ram: '8 GB', storage: '160GB SSD', bandwidth: 'Unmetered', price: 1695, priceLabel: 'R1,695 p/m' }
        ]
      }
    ],
    performance: {
      title: 'Exceptional performance and redundancy.',
      subtitle: 'Built for reliability',
      description: 'Our cloud servers use the very best virtual technology and software to offer you all the benefits of dedicated hosting at a fraction of the cost of traditional physical servers.',
      features: [
        {
          title: 'With over 25 years of experience',
          description: 'Serving South African businesses since 1999, we understand local needs and provide solutions that work in our unique environment.'
        },
        {
          title: 'We fixed-term contracts so we earn your business',
          description: 'No lock-in contracts. We believe our service quality should earn your loyalty, not contractual obligations.'
        },
        {
          title: 'Reliable Infrastructure',
          description: 'Multiple data centers across South Africa ensure your services stay online with 99.9% uptime guarantee.'
        },
        {
          title: 'Local Support Team',
          description: '24/7 support from our South African-based team who understand your business needs.'
        }
      ]
    },
    awards: [
      {
        title: '7x Broadband ISP of the Year',
        description: 'Voted best broadband provider',
        year: '2023'
      },
      {
        title: '5x ASA Africa Category Winner',
        description: 'Excellence in African hosting',
        year: '2023'
      },
      {
        title: '3x IT Person of the Year Winner',
        description: 'Industry leadership recognition',
        year: '2022'
      }
    ]
  }
}