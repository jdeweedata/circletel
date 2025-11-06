'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  ExternalLink,
  BookOpen,
  Presentation,
  FileSpreadsheet,
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'image' | 'video' | 'spreadsheet' | 'presentation'
  category: 'marketing' | 'training' | 'product' | 'sales'
  fileSize?: string
  downloadUrl?: string
  viewUrl?: string
  badge?: string
}

const RESOURCE_ICONS = {
  pdf: FileText,
  image: ImageIcon,
  video: Video,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
}

const CATEGORY_COLORS = {
  marketing: 'bg-purple-100 text-purple-800',
  training: 'bg-blue-100 text-blue-800',
  product: 'bg-green-100 text-green-800',
  sales: 'bg-orange-100 text-orange-800',
}

// Sample resources (in production, these would come from an API or CMS)
const RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'CircleTel Partner Program Overview',
    description: 'Complete guide to the CircleTel partner program, commission structure, and benefits.',
    type: 'pdf',
    category: 'training',
    fileSize: '2.4 MB',
    downloadUrl: '#',
    badge: 'Essential',
  },
  {
    id: '2',
    title: 'Product Brochure - Fibre Packages',
    description: 'High-quality brochure showcasing all CircleTel fibre packages with pricing and features.',
    type: 'pdf',
    category: 'marketing',
    fileSize: '5.1 MB',
    downloadUrl: '#',
  },
  {
    id: '3',
    title: 'CircleTel Logo Pack',
    description: 'Official CircleTel logos in various formats (PNG, SVG, EPS) for marketing materials.',
    type: 'image',
    category: 'marketing',
    fileSize: '12.8 MB',
    downloadUrl: '#',
    badge: 'Essential',
  },
  {
    id: '4',
    title: 'Sales Training Video',
    description: 'Comprehensive training on how to sell CircleTel services and handle objections.',
    type: 'video',
    category: 'training',
    fileSize: '142 MB',
    viewUrl: '#',
  },
  {
    id: '5',
    title: 'Product Comparison Sheet',
    description: 'Side-by-side comparison of all CircleTel packages to help customers choose.',
    type: 'spreadsheet',
    category: 'sales',
    fileSize: '856 KB',
    downloadUrl: '#',
  },
  {
    id: '6',
    title: 'Sales Pitch Deck',
    description: 'Professional presentation template for pitching CircleTel services to businesses.',
    type: 'presentation',
    category: 'sales',
    fileSize: '8.3 MB',
    downloadUrl: '#',
  },
  {
    id: '7',
    title: 'Coverage Map 2025',
    description: 'Latest coverage map showing all areas where CircleTel services are available.',
    type: 'pdf',
    category: 'product',
    fileSize: '4.2 MB',
    downloadUrl: '#',
  },
  {
    id: '8',
    title: 'Social Media Graphics Pack',
    description: 'Ready-to-use social media posts and graphics for promoting CircleTel.',
    type: 'image',
    category: 'marketing',
    fileSize: '28.5 MB',
    downloadUrl: '#',
  },
  {
    id: '9',
    title: 'FAQ Document',
    description: 'Answers to frequently asked questions about CircleTel services and policies.',
    type: 'pdf',
    category: 'training',
    fileSize: '1.2 MB',
    downloadUrl: '#',
  },
]

export default function PartnerResourcesPage() {
  const handleDownload = (resource: Resource) => {
    // In production, this would trigger actual file download
    console.log('Downloading:', resource.title)
    // toast.success(`Downloading ${resource.title}...`)
  }

  const handleView = (resource: Resource) => {
    // In production, this would open file in new tab or modal
    console.log('Viewing:', resource.title)
    // window.open(resource.viewUrl, '_blank')
  }

  // Group resources by category
  const resourcesByCategory = RESOURCES.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = []
    }
    acc[resource.category].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
          Resources
        </h1>
        <p className="text-circleTel-secondaryNeutral mt-2">
          Download marketing materials, product information, and training resources
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-circleTel-orange">{RESOURCES.length}</div>
              <p className="text-sm text-gray-600 mt-1">Total Resources</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {RESOURCES.filter((r) => r.category === 'marketing').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Marketing</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {RESOURCES.filter((r) => r.category === 'training').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Training</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {RESOURCES.filter((r) => r.category === 'sales').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Sales Tools</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources by Category */}
      {Object.entries(resourcesByCategory).map(([category, resources]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{category} Resources</CardTitle>
                <CardDescription>
                  {resources.length} {resources.length === 1 ? 'resource' : 'resources'} available
                </CardDescription>
              </div>
              <Badge className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}>
                {category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => {
                const Icon = RESOURCE_ICONS[resource.type]
                return (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-circleTel-orange/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-circleTel-orange" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-sm text-circleTel-darkNeutral line-clamp-2">
                              {resource.title}
                            </h3>
                            {resource.badge && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {resource.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                          {resource.fileSize && (
                            <p className="text-xs text-gray-400 mt-2">
                              Size: {resource.fileSize}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-3">
                            {resource.downloadUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleDownload(resource)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                            {resource.viewUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleView(resource)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Need More Resources?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            If you need additional marketing materials, custom graphics, or have suggestions
            for new resources, please contact your sales manager.
          </p>
          <p className="font-medium">
            Email: <a href="mailto:partners@circletel.co.za" className="text-circleTel-orange hover:underline">
              partners@circletel.co.za
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
