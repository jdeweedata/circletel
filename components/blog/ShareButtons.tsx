'use client'

import { useState } from 'react'
import { FiX } from 'react-icons/fi'

interface ShareButtonsProps {
  url: string
  title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent fallback
    }
  }

  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-900">Share</h3>
      <div className="flex gap-2">
        {/* X (Twitter) */}
        <a
          href={xShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 text-neutral-700 hover:text-[#F5831F] hover:border-[#F5831F] transition"
          aria-label="Share on X"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.868 6.75h-3.308l7.732-8.835L2.882 2.25h6.6l4.75 6.285 5.312-6.285zM17.55 19.5h1.828L5.566 3.75H3.66l13.89 15.75z" />
          </svg>
        </a>

        {/* LinkedIn */}
        <a
          href={linkedInShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 text-neutral-700 hover:text-[#F5831F] hover:border-[#F5831F] transition"
          aria-label="Share on LinkedIn"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.667-2.236-.91 0-1.385.613-1.605 1.205-.082.2-.103.48-.103.758v5.842h-3.554s.047-9.474 0-10.452h3.554v1.481c.458-.708 1.28-1.717 3.11-1.717 2.27 0 3.97 1.483 3.97 4.667v5.021zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.71 0-.957.769-1.71 1.96-1.71 1.19 0 1.916.753 1.938 1.71 0 .952-.748 1.71-1.983 1.71zm1.582 11.597H3.73V9.963h3.189v10.489zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
          </svg>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 text-neutral-700 hover:text-[#F5831F] hover:border-[#F5831F] transition"
          aria-label="Share on WhatsApp"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.946 1.288l-.355.192-3.674-.964.984 3.6-.235.374a9.847 9.847 0 001.438 5.645l.192.303 3.003.711-.024.339c.589 2.959 3.434 5.210 6.514 5.21h.006c3.479 0 6.426-2.703 6.8-6.215l.036-.335 3.172.667-.239-.375a9.9 9.9 0 00-1.4-3.627l-.213-.304-.823-3.073 3.624-1.084-.365-.294a9.874 9.874 0 00-3.8-1.238l-.38-.047c-1.552-.134-3.066.279-4.514 1.22l-.283.188z" />
          </svg>
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 text-neutral-700 hover:text-[#F5831F] hover:border-[#F5831F] transition"
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
