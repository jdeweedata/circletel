import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to real-time product updates from Supabase
 * Automatically invalidates React Query cache when products are updated
 *
 * @param productId - Optional specific product ID to watch. If not provided, watches all products
 */
export function useProductRealtime(productId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Create channel for product changes
    const channelName = productId ? `product-${productId}` : 'products';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'products',
          ...(productId && { filter: `id=eq.${productId}` })
        },
        (payload) => {
          console.log('Product change detected:', payload);

          // Invalidate relevant queries based on the event
          if (payload.eventType === 'INSERT') {
            // New product added
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
          } else if (payload.eventType === 'UPDATE') {
            // Product updated
            if (productId) {
              queryClient.invalidateQueries({ queryKey: ['product', productId] });
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
          } else if (payload.eventType === 'DELETE') {
            // Product deleted
            if (productId) {
              queryClient.invalidateQueries({ queryKey: ['product', productId] });
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channelName} for realtime updates`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${channelName}`);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log(`Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient, supabase]);
}

/**
 * Hook to subscribe to promotional pricing changes
 * Watches the promotions table for changes
 */
export function usePromotionsRealtime() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('promotions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotions'
        },
        (payload) => {
          console.log('Promotion change detected:', payload);

          // Invalidate promotion queries
          queryClient.invalidateQueries({ queryKey: ['promotions'] });

          // Also invalidate products since promotions affect pricing display
          if (payload.new && typeof payload.new === 'object' && 'product_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['product', payload.new.product_id] });
          }
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to promotions for realtime updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}

/**
 * Hook to subscribe to audit log changes
 * Useful for showing real-time audit trail updates
 *
 * @param productId - Product ID to watch audit logs for
 */
export function useProductAuditRealtime(productId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`product-audit-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen to new audit entries
          schema: 'public',
          table: 'product_audit_logs',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          console.log('New audit log entry:', payload);

          // Invalidate audit logs query
          queryClient.invalidateQueries({ queryKey: ['product', productId, 'audit-logs'] });
          queryClient.invalidateQueries({ queryKey: ['product', productId, 'audit-summary'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to audit logs for product ${productId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient, supabase]);
}

/**
 * Combined hook for comprehensive product monitoring
 * Subscribes to product, promotion, and audit log changes
 *
 * @param productId - Optional product ID. If not provided, watches all products
 */
export function useProductMonitoring(productId?: string) {
  useProductRealtime(productId);
  usePromotionsRealtime();
  if (productId) {
    useProductAuditRealtime(productId);
  }
}
