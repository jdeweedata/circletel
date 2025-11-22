'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export default function CMSPage() {
  return (
    <div className="h-[calc(100vh-6rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden border-t border-gray-200 shadow-inner relative z-0">
      <NextStudio config={config} />
    </div>
  )
}
