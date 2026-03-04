'use client'
import { PiArrowRightBold, PiSparkleBold, PiXBold } from 'react-icons/pi';

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export interface AnnouncementBarProps {
  message: string
  linkText?: string
  linkUrl?: string
  bgColor?: string
  textColor?: string
  announcementId?: string
  validUntil?: string
  onDismiss?: () => void
}

const DISMISS_KEY_PREFIX = 'circletel_announcement_dismissed_'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Check if announcement was dismissed within the last 24 hours
 */
function isDismissed(announcementId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const key = `${DISMISS_KEY_PREFIX}${announcementId}`
    const dismissedAt = localStorage.getItem(key)

    if (!dismissedAt) return false

    const dismissTime = parseInt(dismissedAt, 10)
    const now = Date.now()

    // If dismissed more than 24 hours ago, clear and show again
    if (now - dismissTime > DISMISS_DURATION_MS) {
      localStorage.removeItem(key)
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Mark announcement as dismissed
 */
function setDismissed(announcementId: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = `${DISMISS_KEY_PREFIX}${announcementId}`
    localStorage.setItem(key, Date.now().toString())
  } catch {
    // localStorage might not be available
  }
}

/**
 * AnnouncementBar Component
 *
 * Sticky announcement bar for site-wide promotions and messages.
 * Features:
 * - Dismiss button with 24-hour localStorage persistence
 * - Mobile-responsive text sizing
 * - Subtle entrance animation
 * - CircleTel orange default background
 * - Optional countdown timer for time-sensitive offers
 */
export function AnnouncementBar({
  message,
  linkText,
  linkUrl,
  bgColor = '#F5841E', // CircleTel orange
  textColor = '#FFFFFF',
  announcementId = 'default',
  validUntil,
  onDismiss
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)

  // Check if dismissed and animate in
  useEffect(() => {
    if (isDismissed(announcementId)) {
      setIsVisible(false)
      return
    }

    // Small delay for smooth entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [announcementId])

  // Countdown timer for time-sensitive offers
  useEffect(() => {
    if (!validUntil) return

    const updateCountdown = () => {
      const end = new Date(validUntil).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setCountdown(null)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setCountdown(`${days}d ${hours}h left`)
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m left`)
      } else {
        setCountdown(`${minutes}m left`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [validUntil])

  const handleDismiss = () => {
    setIsClosing(true)
    setDismissed(announcementId)

    // Animate out before hiding
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 300)
  }

  if (!isVisible && !isClosing) return null

  return (
    <div
      role="banner"
      aria-label="Announcement"
      className={`
        w-full py-2.5 px-4 flex items-center justify-center gap-3
        text-sm font-medium transition-all duration-300 ease-out
        ${isClosing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
      style={{
        backgroundColor: bgColor,
        color: textColor
      }}
    >
      {/* Sparkle icon for visual interest */}
      <PiSparkleBold className="w-4 h-4 flex-shrink-0 hidden sm:block" />

      {/* Main message */}
      <div className="flex items-center gap-2 text-center flex-wrap justify-center">
        <span className="text-xs sm:text-sm">{message}</span>

        {/* Countdown badge */}
        {countdown && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: textColor
            }}
          >
            {countdown}
          </span>
        )}

        {/* CTA Link */}
        {linkText && linkUrl && (
          <Link
            href={linkUrl}
            className="
              inline-flex items-center gap-1 font-semibold underline-offset-2
              hover:underline focus:outline-none focus:ring-2 focus:ring-white/50
              focus:ring-offset-2 rounded transition-all
            "
            style={{ color: textColor }}
          >
            {linkText}
            <PiArrowRightBold className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="
          absolute right-2 sm:right-4 p-1 rounded-full
          opacity-70 hover:opacity-100 transition-opacity
          focus:outline-none focus:ring-2 focus:ring-white/50
        "
        aria-label="Dismiss announcement"
        style={{ color: textColor }}
      >
        <PiXBold className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * AnnouncementBarWrapper - Server/Client boundary component
 * Fetches announcement data and renders the bar
 */
export function AnnouncementBarWrapper() {
  const [announcement, setAnnouncement] = useState<{
    id: string
    message: string
    link_text?: string
    link_url?: string
    bg_color?: string
    text_color?: string
    valid_until?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/marketing/announcement', {
          next: { revalidate: 60 } // Cache for 1 minute
        })

        if (!res.ok) {
          setLoading(false)
          return
        }

        const data = await res.json()
        setAnnouncement(data.announcement)
      } catch (error) {
        console.error('[AnnouncementBar] Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [])

  // Don't render anything while loading or if no announcement
  if (loading || !announcement) return null

  return (
    <AnnouncementBar
      message={announcement.message}
      linkText={announcement.link_text}
      linkUrl={announcement.link_url}
      bgColor={announcement.bg_color}
      textColor={announcement.text_color}
      announcementId={announcement.id}
      validUntil={announcement.valid_until}
    />
  )
}

export default AnnouncementBar
