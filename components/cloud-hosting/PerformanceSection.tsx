import React from 'react'
import { CheckCircle, Server, Shield, Zap, Globe } from 'lucide-react'

interface PerformanceFeature {
  title: string
  description: string
}

interface PerformanceSectionProps {
  data?: {
    title: string
    subtitle: string
    description: string
    features: PerformanceFeature[]
  }
}

const defaultData = {
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
}

export default function PerformanceSection({ data = defaultData }: PerformanceSectionProps) {
  return (
    <section className="relative bg-slate-900 text-white py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl"></div>
      </div>

      {/* Geometric Decorations */}
      <div className="absolute top-20 right-20 transform rotate-45">
        <div className="w-32 h-32 border-4 border-orange-500/20"></div>
      </div>
      <div className="absolute bottom-20 left-20">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{data.title}</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">{data.description}</p>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all">
            <Server className="w-12 h-12 mx-auto mb-3 text-orange-400" />
            <div className="text-3xl font-bold mb-2">99.9%</div>
            <p className="text-gray-300">Uptime SLA</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all">
            <Zap className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <div className="text-3xl font-bold mb-2">&lt;20ms</div>
            <p className="text-gray-300">Local Latency</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all">
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <div className="text-3xl font-bold mb-2">24/7</div>
            <p className="text-gray-300">Security Monitoring</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all">
            <Globe className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <div className="text-3xl font-bold mb-2">3</div>
            <p className="text-gray-300">Data Centers</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {data.features.map((feature, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10 hover:border-orange-500/50 transition-all group">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-6">
            And best of all, it won't cost you arms and a leg
          </h3>
          <button className="px-8 py-4 bg-circleTel-orange hover:bg-orange-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-xl">
            View Cloud Hosting Solutions
          </button>
        </div>
      </div>
    </section>
  )
}