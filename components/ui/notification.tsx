"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationProps {
  message: string
  type?: "success" | "error" | "info" | "warning"
  duration?: number
  onClose?: () => void
  className?: string
}

export function Notification({
  message,
  type = "success",
  duration = 3000,
  onClose,
  className
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-black"
  }

  return (
    <div
      className={cn(
        "fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg font-medium text-sm max-w-md transition-all duration-300",
        typeStyles[type],
        isExiting ? "animate-slide-out" : "animate-slide-in",
        className
      )}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => {
            setIsVisible(false)
            onClose?.()
          }, 300)
        }}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook for managing notifications
export function useNotification() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    type: NotificationProps["type"]
    duration?: number
  }>>([])

  const showNotification = (
    message: string,
    type: NotificationProps["type"] = "success",
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7)
    setNotifications(prev => [...prev, { id, message, type, duration }])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const NotificationContainer = () => (
    <div className="fixed top-5 right-5 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )

  return {
    showNotification,
    NotificationContainer
  }
}