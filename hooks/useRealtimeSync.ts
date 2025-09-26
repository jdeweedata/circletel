import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeSyncOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  enabled?: boolean
}

interface RealtimeSyncState<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useRealtimeSync<T extends Record<string, any> & { id: string } = Record<string, unknown> & { id: string }>(
  options: RealtimeSyncOptions,
  initialData: T[] = []
) {
  const [state, setState] = useState<RealtimeSyncState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    lastUpdated: null
  })

  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<T>) => {
    console.log('Realtime change received:', payload)

    setState(prev => {
      let newData = [...prev.data]

      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            newData.push(payload.new as T)
          }
          break

        case 'UPDATE':
          if (payload.new) {
            const index = newData.findIndex((item) => item.id === payload.new.id)
            if (index >= 0) {
              newData[index] = payload.new as T
            }
          }
          break

        case 'DELETE':
          if (payload.old) {
            newData = newData.filter((item: T & { id: string }) => item.id !== payload.old.id)
          }
          break
      }

      return {
        ...prev,
        data: newData,
        lastUpdated: new Date(),
        error: null
      }
    })
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('Realtime sync error:', error)
    setState(prev => ({
      ...prev,
      error: error.message || 'Realtime sync error',
      isLoading: false
    }))
  }, [])

  // Initialize realtime subscription
  useEffect(() => {
    if (options.enabled === false) {
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    const channelName = `realtime:${options.table}`
    const newChannel: any = (supabase as any).channel(channelName)

    // Configure the subscription based on options
    newChannel.on(
      'postgres_changes',
      {
        event: options.event || '*',
        schema: 'public',
        table: options.table,
        ...(options.filter && { filter: options.filter })
      },
      handleChange
    )

    newChannel.subscribe((status: string) => {
      console.log(`Realtime subscription status for ${options.table}:`, status)

      if (status === 'SUBSCRIBED') {
        setState(prev => ({ ...prev, isLoading: false }))
      } else if (status === 'CHANNEL_ERROR') {
        handleError(new Error('Failed to subscribe to realtime updates'))
      }
    })

    setChannel(newChannel)

    return () => {
      console.log(`Unsubscribing from realtime updates for ${options.table}`)
      newChannel.unsubscribe()
      setChannel(null)
    }
  }, [options.table, options.event, options.filter, options.enabled, handleChange, handleError])

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase
        .from(options.table)
        .select('*')

      if (error) throw error

      setState(prev => ({
        ...prev,
        data: data || [],
        isLoading: false,
        lastUpdated: new Date()
      }))
    } catch (error) {
      handleError(error as Error)
    }
  }, [options.table, handleError])

  // Update data manually (for optimistic updates)
  const updateData = useCallback((newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: newData,
      lastUpdated: new Date()
    }))
  }, [])

  return {
    ...state,
    refresh,
    updateData,
    isConnected: channel?.state === 'joined'
  }
}

// Specialized hooks for specific admin tables
export function useProductsRealtime(enabled: boolean = true) {
  return useRealtimeSync({
    table: 'products',
    enabled
  })
}

export function useApprovalsRealtime(enabled: boolean = true) {
  return useRealtimeSync({
    table: 'approvals',
    event: '*',
    enabled
  })
}

export function useUsersRealtime(enabled: boolean = true) {
  return useRealtimeSync({
    table: 'users',
    enabled
  })
}

// Hook for admin dashboard real-time stats
export function useAdminStatsRealtime() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingApprovals: 0,
    approvedProducts: 0,
    revenueImpact: 0,
    lastUpdated: null as Date | null
  })

  const products = useRealtimeSync({ table: 'products', enabled: true })
  const approvals = useRealtimeSync({ table: 'approvals', enabled: true })

  useEffect(() => {
    // Calculate stats from real-time data
    const totalProducts = products.data.length
    const pendingApprovals = approvals.data.filter((a: Record<string, unknown>) =>
      a.status === 'pending' || a.status === 'under_review'
    ).length
    const approvedProducts = products.data.filter((p: Record<string, unknown>) =>
      p.is_active === true
    ).length

    setStats({
      totalProducts,
      pendingApprovals,
      approvedProducts,
      revenueImpact: 125000, // Mock data for now
      lastUpdated: new Date()
    })
  }, [products.data, approvals.data])

  return {
    stats,
    isLoading: products.isLoading || approvals.isLoading,
    error: products.error || approvals.error,
    refresh: () => {
      products.refresh()
      approvals.refresh()
    }
  }
}