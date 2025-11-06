import { NextRequest, NextResponse } from 'next/server'

// This API route fetches cloud hosting page data from Strapi CMS
export async function GET(request: NextRequest) {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
    const strapiToken = process.env.STRAPI_API_TOKEN

    if (!strapiToken) {
      // Return default data if Strapi is not configured
      return NextResponse.json({ 
        data: null,
        message: 'Using default data - Strapi not configured' 
      })
    }

    // Fetch cloud hosting page data from Strapi
    const response = await fetch(
      `${strapiUrl}/api/cloud-hosting-page?populate=deep`,
      {
        headers: {
          'Authorization': `Bearer ${strapiToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`)
    }

    const strapiData = await response.json()

    // Transform Strapi data to match our component structure
    const transformedData = transformStrapiData(strapiData.data)

    return NextResponse.json({ 
      data: transformedData,
      message: 'Data fetched from Strapi successfully'
    })

  } catch (error) {
    console.error('Error fetching cloud hosting data from Strapi:', error)
    
    // Return error response but don't break the page
    return NextResponse.json(
      { 
        data: null,
        message: 'Error fetching from Strapi, using default data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Return 200 to allow fallback to default data
    )
  }
}

function transformStrapiData(strapiData: any) {
  if (!strapiData || !strapiData.attributes) {
    return null
  }

  const { attributes } = strapiData

  return {
    hero: attributes.hero ? {
      title: attributes.hero.title,
      subtitle: attributes.hero.subtitle,
      backgroundImage: attributes.hero.backgroundImage?.data ? {
        url: attributes.hero.backgroundImage.data.attributes.url
      } : undefined
    } : undefined,

    features: attributes.features?.map((feature: any) => ({
      icon: feature.icon || 'database',
      title: feature.title,
      description: feature.description
    })) || [],

    testimonial: attributes.testimonial ? {
      statNumber: attributes.testimonial.statNumber,
      statText: attributes.testimonial.statText,
      testimonialText: attributes.testimonial.testimonialText,
      testimonialAuthor: attributes.testimonial.testimonialAuthor,
      testimonialRole: attributes.testimonial.testimonialRole
    } : undefined,

    pricingPlans: attributes.pricingPlans?.map((plan: any) => ({
      planType: plan.planType,
      title: plan.title,
      description: plan.description,
      tiers: plan.tiers?.map((tier: any) => ({
        name: tier.name,
        cpu: tier.cpu,
        ram: tier.ram,
        storage: tier.storage,
        bandwidth: tier.bandwidth,
        price: parseFloat(tier.price),
        priceLabel: tier.priceLabel,
        isPopular: tier.isPopular || false
      })) || []
    })) || [],

    performance: attributes.performance ? {
      title: attributes.performance.title,
      subtitle: attributes.performance.subtitle,
      description: attributes.performance.description,
      features: attributes.performance.features?.map((feature: any) => ({
        title: feature.title,
        description: feature.description
      })) || []
    } : undefined,

    awards: attributes.awards?.map((award: any) => ({
      title: award.title,
      description: award.description,
      year: award.year,
      icon: award.icon?.data ? {
        url: award.icon.data.attributes.url
      } : undefined
    })) || []
  }
}