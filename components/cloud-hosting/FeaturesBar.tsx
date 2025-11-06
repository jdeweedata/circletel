import React from 'react'
import { Database, Settings, Users, Clock } from 'lucide-react'

interface Feature {
  icon: string
  title: string
  description: string
}

interface FeaturesBarProps {
  features?: Feature[]
}

const iconMap: { [key: string]: React.ReactNode } = {
  database: <Database className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />
}

const defaultFeatures = [
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
]

export default function FeaturesBar({ features = defaultFeatures }: FeaturesBarProps) {
  return (
    <section className="bg-white py-8 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-circleTel-orange/10 flex items-center justify-center group-hover:bg-circleTel-orange transition-colors">
                  <div className="text-circleTel-orange group-hover:text-white transition-colors">
                    {iconMap[feature.icon] || <Database className="w-6 h-6" />}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}