/**
 * Real-time MTN Signal Strength Hook
 *
 * Provides real-time signal strength data mapping for MTN coverage areas
 * with automatic updates, caching, and performance optimization.
 *
 * Features:
 * - Real-time signal strength monitoring
 * - Viewport-based data loading
 * - Automatic refresh intervals
 * - Performance optimization with debouncing
 * - Error handling and fallback data
 * - Multi-technology support (4G/5G/LTE)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mtnWmsService, MTNCoverageResult } from '@/services/mtnWmsService';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface SignalStrengthPoint {
  id: string;
  lat: number;
  lng: number;
  technology: '4G' | '5G' | 'LTE';
  signalStrength: number; // 0-100
  speedEstimate: number; // Mbps
  confidence: number; // 0-100
  timestamp: number;
  lastUpdated: Date;
}

export interface SignalStrengthMapOptions {
  /** Map viewport bounds */
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  /** Technologies to monitor */
  technologies: Array<'4G' | '5G' | 'LTE'>;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Maximum number of data points to track */
  maxDataPoints?: number;
  /** Enable real-time updates */
  realTimeUpdates?: boolean;
}

interface SignalStrengthCache {
  points: Map<string, SignalStrengthPoint>;
  lastUpdated: number;
  bounds: SignalStrengthMapOptions['bounds'];
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useMTNSignalStrength(options: SignalStrengthMapOptions) {
  const {
    bounds,
    technologies,
    refreshInterval = 30000, // 30 seconds
    maxDataPoints = 100,
    realTimeUpdates = true
  } = options;

  // State management
  const [signalPoints, setSignalPoints] = useState<SignalStrengthPoint[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(realTimeUpdates);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for performance optimization
  const boundsRef = useRef(bounds);
  const technologiesRef = useRef(technologies);
  const cacheRef = useRef<SignalStrengthCache>({
    points: new Map(),
    lastUpdated: 0,
    bounds
  });

  // Query client for cache management
  const queryClient = useQueryClient();

  // =============================================================================
  // Cache Key Generation
  // =============================================================================

  const generateCacheKey = useCallback((bounds: SignalStrengthMapOptions['bounds'], techs: string[]) => {
    const boundsStr = `${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
    const techStr = techs.sort().join(',');
    return `mtn-signal-strength-${boundsStr}-${techStr}`;
  }, []);

  // =============================================================================
  // Data Fetching
  // =============================================================================

  /**
   * Generate grid points within viewport bounds
   */
  const generateGridPoints = useCallback((bounds: SignalStrengthMapOptions['bounds'], density = 5) => {
    const points: { lat: number; lng: number }[] = [];
    const latStep = Math.abs(bounds.north - bounds.south) / density;
    const lngStep = Math.abs(bounds.east - bounds.west) / density;

    for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
      for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
        points.push({ lat, lng });
      }
    }

    return points.slice(0, maxDataPoints); // Limit total points
  }, [maxDataPoints]);

  /**
   * Fetch signal strength data for grid points
   */
  const fetchSignalStrengthData = useCallback(async () => {
    const gridPoints = generateGridPoints(bounds);
    const allSignalPoints: SignalStrengthPoint[] = [];

    try {
      // Process points in batches to avoid overwhelming the API
      const batchSize = 6; // Parallel requests limit
      for (let i = 0; i < gridPoints.length; i += batchSize) {
        const batch = gridPoints.slice(i, i + batchSize);

        const batchPromises = batch.flatMap(point =>
          technologies.map(async tech => {
            try {
              const result = await mtnWmsService.checkCoverage(point.lat, point.lng, tech);

              const signalPoint: SignalStrengthPoint = {
                id: `${point.lat}-${point.lng}-${tech}`,
                lat: point.lat,
                lng: point.lng,
                technology: tech,
                signalStrength: result.signalStrength,
                speedEstimate: result.speedEstimate,
                confidence: result.confidence,
                timestamp: Date.now(),
                lastUpdated: new Date()
              };

              return signalPoint;
            } catch (error) {
              console.warn(`Failed to get ${tech} signal at ${point.lat}, ${point.lng}:`, error);
              return null;
            }
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        const validResults = batchResults
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => (result as PromiseFulfilledResult<SignalStrengthPoint>).value);

        allSignalPoints.push(...validResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < gridPoints.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      return allSignalPoints;
    } catch (error) {
      console.error('Failed to fetch signal strength data:', error);
      setError(error as Error);
      return [];
    }
  }, [bounds, technologies, generateGridPoints]);

  // =============================================================================
  // React Query Integration
  // =============================================================================

  const cacheKey = generateCacheKey(bounds, technologies);

  const {
    data: queryData,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt
  } = useQuery({
    queryKey: [cacheKey],
    queryFn: fetchSignalStrengthData,
    refetchInterval: isRealTimeActive ? refreshInterval : false,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    cacheTime: refreshInterval * 2, // Keep in cache for twice the refresh interval
    retry: 2,
    retryDelay: 1000,
    onSuccess: (data) => {
      setSignalPoints(data);
      setLastUpdate(new Date());
      setError(null);

      // Update cache
      cacheRef.current = {
        points: new Map(data.map(point => [point.id, point])),
        lastUpdated: Date.now(),
        bounds
      };
    },
    onError: (error) => {
      console.error('Signal strength query failed:', error);
      setError(error as Error);
    }
  });

  // =============================================================================
  // Real-time Updates Management
  // =============================================================================

  const toggleRealTimeUpdates = useCallback((enabled: boolean) => {
    setIsRealTimeActive(enabled);
  }, []);

  const manualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // =============================================================================
  // Data Processing and Filtering
  // =============================================================================

  /**
   * Get signal points filtered by technology
   */
  const getPointsByTechnology = useCallback((technology: '4G' | '5G' | 'LTE') => {
    return signalPoints.filter(point => point.technology === technology);
  }, [signalPoints]);

  /**
   * Get signal points within signal strength range
   */
  const getPointsBySignalRange = useCallback((minStrength: number, maxStrength: number) => {
    return signalPoints.filter(point =>
      point.signalStrength >= minStrength && point.signalStrength <= maxStrength
    );
  }, [signalPoints]);

  /**
   * Get aggregated statistics
   */
  const getStatistics = useCallback(() => {
    if (signalPoints.length === 0) {
      return {
        totalPoints: 0,
        averageSignal: 0,
        coveragePercentage: 0,
        technologiesActive: [],
        strongSignalPercentage: 0
      };
    }

    const totalPoints = signalPoints.length;
    const averageSignal = signalPoints.reduce((sum, point) => sum + point.signalStrength, 0) / totalPoints;
    const pointsWithSignal = signalPoints.filter(point => point.signalStrength > 20);
    const strongSignalPoints = signalPoints.filter(point => point.signalStrength >= 80);
    const coveragePercentage = (pointsWithSignal.length / totalPoints) * 100;
    const strongSignalPercentage = (strongSignalPoints.length / totalPoints) * 100;
    const technologiesActive = [...new Set(signalPoints.map(point => point.technology))];

    return {
      totalPoints,
      averageSignal: Math.round(averageSignal),
      coveragePercentage: Math.round(coveragePercentage),
      technologiesActive,
      strongSignalPercentage: Math.round(strongSignalPercentage)
    };
  }, [signalPoints]);

  // =============================================================================
  // Effect Hooks
  // =============================================================================

  // Update refs when props change
  useEffect(() => {
    boundsRef.current = bounds;
    technologiesRef.current = technologies;
  }, [bounds, technologies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queryClient) {
        queryClient.removeQueries({ queryKey: [cacheKey] });
      }
    };
  }, [cacheKey, queryClient]);

  // =============================================================================
  // Return Hook Interface
  // =============================================================================

  return {
    // Data
    signalPoints,
    statistics: getStatistics(),
    lastUpdate,

    // Loading states
    isLoading,
    isError: isError || !!error,
    error,

    // Real-time controls
    isRealTimeActive,
    toggleRealTimeUpdates,
    manualRefresh,

    // Data filtering
    getPointsByTechnology,
    getPointsBySignalRange,

    // Metadata
    dataUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    cacheKey
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert signal strength to color for visualization
 */
export function getSignalStrengthColor(signalStrength: number): string {
  if (signalStrength >= 80) return '#10B981'; // Green - Excellent
  if (signalStrength >= 60) return '#84CC16'; // Light Green - Good
  if (signalStrength >= 40) return '#F59E0B'; // Orange - Fair
  if (signalStrength >= 20) return '#EF4444'; // Red - Poor
  return '#6B7280'; // Gray - No Signal
}

/**
 * Get signal quality label
 */
export function getSignalQualityLabel(signalStrength: number): string {
  if (signalStrength >= 80) return 'Excellent';
  if (signalStrength >= 60) return 'Good';
  if (signalStrength >= 40) return 'Fair';
  if (signalStrength >= 20) return 'Poor';
  return 'No Signal';
}

/**
 * Calculate viewport bounds from center and zoom
 */
export function calculateViewportBounds(
  center: { lat: number; lng: number },
  zoom: number
): SignalStrengthMapOptions['bounds'] {
  // Approximate bounds calculation based on zoom level
  const latOffset = 0.01 * Math.pow(2, 12 - zoom);
  const lngOffset = 0.01 * Math.pow(2, 12 - zoom);

  return {
    north: center.lat + latOffset,
    south: center.lat - latOffset,
    east: center.lng + lngOffset,
    west: center.lng - lngOffset
  };
}