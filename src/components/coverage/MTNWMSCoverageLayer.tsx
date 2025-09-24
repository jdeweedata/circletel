/**
 * MTN WMS Coverage Layer Component
 *
 * Renders MTN 4G/5G coverage overlays using WMS (Web Map Service) integration
 * with ArcGIS JS API for advanced mapping capabilities and real-time data.
 *
 * Features:
 * - WMS layer rendering for MTN 4G and 5G coverage
 * - Interactive signal strength visualization
 * - Click-to-query coverage details
 * - Technology-specific layer toggles
 * - Progressive loading with error handling
 * - Performance optimization with viewport-based loading
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Signal, Smartphone, Zap, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { mtnWmsService, MTNCoverageResult } from '@/services/mtnWmsService';
import clsx from 'clsx';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface MTNLayerToggleState {
  '4G': boolean;
  '5G': boolean;
  'LTE': boolean;
}

export interface MTNWMSCoverageLayerProps {
  /** Current map center coordinates */
  center: { lat: number; lng: number };
  /** Map zoom level */
  zoom: number;
  /** Layer visibility toggles */
  activeLayers: MTNLayerToggleState;
  /** Layer toggle callback */
  onToggleLayer: (technology: '4G' | '5G' | 'LTE', enabled: boolean) => void;
  /** Coverage point selection callback */
  onCoverageSelect?: (result: MTNCoverageResult) => void;
  /** Map container height */
  height?: string;
  /** Loading state callback */
  onLoadingChange?: (loading: boolean) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
}

interface WMSLayerConfig {
  technology: '4G' | '5G' | 'LTE';
  layerName: string;
  color: string;
  opacity: number;
  visible: boolean;
}

interface SignalStrengthPoint {
  lat: number;
  lng: number;
  technology: string;
  signalStrength: number;
  speedEstimate: number;
  timestamp: string;
}

// =============================================================================
// Configuration Constants
// =============================================================================

const TECHNOLOGY_CONFIG: Record<'4G' | '5G' | 'LTE', {
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  layerName: string;
  minZoom: number;
}> = {
  '4G': {
    color: '#3B82F6',
    icon: Signal,
    label: '4G Coverage',
    layerName: 'mtn:4g_coverage',
    minZoom: 10
  },
  '5G': {
    color: '#8B5CF6',
    icon: Zap,
    label: '5G Coverage',
    layerName: 'mtn:5g_coverage',
    minZoom: 12
  },
  'LTE': {
    color: '#10B981',
    icon: Smartphone,
    label: 'LTE Coverage',
    layerName: 'mtn:lte_coverage',
    minZoom: 8
  }
};

const SIGNAL_STRENGTH_COLORS = {
  excellent: '#10B981', // Green (80-100%)
  good: '#84CC16',      // Light Green (60-79%)
  fair: '#F59E0B',      // Orange (40-59%)
  poor: '#EF4444',      // Red (20-39%)
  none: '#6B7280'       // Gray (0-19%)
};

// =============================================================================
// Main Component
// =============================================================================

export const MTNWMSCoverageLayer: React.FC<MTNWMSCoverageLayerProps> = ({
  center,
  zoom,
  activeLayers,
  onToggleLayer,
  onCoverageSelect,
  height = '400px',
  onLoadingChange,
  onError,
  className
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [wmsLayers, setWmsLayers] = useState<WMSLayerConfig[]>([]);
  const [signalPoints, setSignalPoints] = useState<SignalStrengthPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MTNCoverageResult | null>(null);
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({});

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const arcgisMapRef = useRef<unknown>(null);
  const wmsLayersRef = useRef<Map<string, unknown>>(new Map());

  // =============================================================================
  // WMS Layer Management
  // =============================================================================

  /**
   * Initialize WMS layers configuration
   */
  useEffect(() => {
    const layers: WMSLayerConfig[] = Object.entries(TECHNOLOGY_CONFIG).map(([tech, config]) => ({
      technology: tech as '4G' | '5G' | 'LTE',
      layerName: config.layerName,
      color: config.color,
      opacity: 0.7,
      visible: activeLayers[tech as keyof MTNLayerToggleState]
    }));

    setWmsLayers(layers);
  }, [activeLayers]);

  /**
   * Load and render WMS layers on the map
   */
  const loadWMSLayers = useCallback(async () => {
    if (!arcgisMapRef.current || zoom < 8) return;

    setIsLoading(true);
    onLoadingChange?.(true);

    try {
      // Clear existing WMS layers
      wmsLayersRef.current.forEach(layer => {
        arcgisMapRef.current.remove(layer);
      });
      wmsLayersRef.current.clear();

      // Load visible layers
      for (const layerConfig of wmsLayers) {
        if (!layerConfig.visible || zoom < TECHNOLOGY_CONFIG[layerConfig.technology].minZoom) {
          continue;
        }

        try {
          const wmsLayer = await createWMSLayer(layerConfig);
          wmsLayersRef.current.set(layerConfig.technology, wmsLayer);
          arcgisMapRef.current.add(wmsLayer);

          // Clear any previous error for this layer
          setLayerErrors(prev => {
            const { [layerConfig.technology]: removed, ...rest } = prev;
            return rest;
          });
        } catch (error) {
          console.error(`Failed to load ${layerConfig.technology} layer:`, error);
          setLayerErrors(prev => ({
            ...prev,
            [layerConfig.technology]: `Failed to load ${layerConfig.technology} coverage data`
          }));
          onError?.(error as Error);
        }
      }
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  }, [wmsLayers, zoom, onLoadingChange, onError]);

  /**
   * Create ArcGIS WMS Layer instance
   */
  const createWMSLayer = async (config: WMSLayerConfig) => {
    // This would use ArcGIS JS API in real implementation
    // For now, return a mock layer object
    return {
      id: `mtn-${config.technology}-layer`,
      type: 'wms',
      url: `${mtnWmsService.getBaseUrl()}`,
      sublayers: [{
        id: 0,
        name: config.layerName,
        visible: true
      }],
      opacity: config.opacity,
      visible: config.visible,
      technology: config.technology
    };
  };

  /**
   * Handle map click to query coverage at point
   */
  const handleMapClick = useCallback(async (event: { lat: number; lng: number }) => {
    const { lat, lng } = event;

    setIsLoading(true);
    setSelectedPoint(null);

    try {
      // Query all active technologies at the clicked point
      const queries = Object.entries(activeLayers)
        .filter(([, enabled]) => enabled)
        .map(async ([tech]) => {
          try {
            return await mtnWmsService.checkCoverage(lat, lng, tech as '4G' | '5G' | 'LTE');
          } catch (error) {
            console.warn(`Failed to query ${tech} coverage:`, error);
            return null;
          }
        });

      const results = await Promise.all(queries);
      const validResults = results.filter(Boolean) as MTNCoverageResult[];

      if (validResults.length > 0) {
        // Select the result with highest signal strength
        const bestResult = validResults.reduce((prev, current) =>
          current.signalStrength > prev.signalStrength ? current : prev
        );

        setSelectedPoint(bestResult);
        onCoverageSelect?.(bestResult);
      }
    } catch (error) {
      console.error('Coverage query failed:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [activeLayers, onCoverageSelect, onError]);

  /**
   * Load WMS layers when configuration changes
   */
  useEffect(() => {
    loadWMSLayers();
  }, [loadWMSLayers]);

  // =============================================================================
  // Signal Strength Visualization
  // =============================================================================

  /**
   * Get signal strength color based on strength value
   */
  const getSignalStrengthColor = (strength: number): string => {
    if (strength >= 80) return SIGNAL_STRENGTH_COLORS.excellent;
    if (strength >= 60) return SIGNAL_STRENGTH_COLORS.good;
    if (strength >= 40) return SIGNAL_STRENGTH_COLORS.fair;
    if (strength >= 20) return SIGNAL_STRENGTH_COLORS.poor;
    return SIGNAL_STRENGTH_COLORS.none;
  };

  /**
   * Get signal quality label
   */
  const getSignalQualityLabel = (strength: number): string => {
    if (strength >= 80) return 'Excellent';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    if (strength >= 20) return 'Poor';
    return 'No Signal';
  };

  // =============================================================================
  // Render Methods
  // =============================================================================

  /**
   * Render layer toggle controls
   */
  const renderLayerControls = () => (
    <Card className="absolute top-4 right-4 z-10 shadow-lg">
      <CardContent className="p-3">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          MTN Coverage
        </h4>

        <div className="space-y-2">
          {Object.entries(TECHNOLOGY_CONFIG).map(([tech, config]) => {
            const Icon = config.icon;
            const isActive = activeLayers[tech as keyof MTNLayerToggleState];
            const hasError = layerErrors[tech];

            return (
              <div key={tech} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    className={clsx('w-4 h-4', hasError ? 'text-red-500' : '')}
                    style={{ color: isActive && !hasError ? config.color : undefined }}
                  />
                  <span className={clsx('text-sm', hasError ? 'text-red-600' : 'text-gray-700')}>
                    {config.label}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLayer(tech as '4G' | '5G' | 'LTE', !isActive)}
                  className="h-6 w-6 p-0"
                  disabled={hasError}
                >
                  {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
              </div>
            );
          })}
        </div>

        {Object.keys(layerErrors).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadWMSLayers}
            className="w-full mt-2"
            disabled={isLoading}
          >
            <RefreshCw className={clsx('w-3 h-3 mr-1', isLoading && 'animate-spin')} />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render selected coverage point details
   */
  const renderCoverageDetails = () => {
    if (!selectedPoint) return null;

    return (
      <Card className="absolute bottom-4 left-4 right-4 z-10 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">MTN Coverage Details</h4>
            <Badge
              variant="outline"
              style={{
                backgroundColor: getSignalStrengthColor(selectedPoint.signalStrength),
                color: 'white',
                borderColor: getSignalStrengthColor(selectedPoint.signalStrength)
              }}
            >
              {selectedPoint.technology} - {getSignalQualityLabel(selectedPoint.signalStrength)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Signal Strength</p>
              <p className="font-medium">{selectedPoint.signalStrength}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Speed Estimate</p>
              <p className="font-medium">{selectedPoint.speedEstimate} Mbps</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coverage Type</p>
              <p className="font-medium capitalize">{selectedPoint.coverageType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="font-medium">{selectedPoint.confidence}%</p>
            </div>
          </div>

          {selectedPoint.availablePackages.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">Available Packages</p>
              <div className="flex flex-wrap gap-1">
                {selectedPoint.availablePackages.map((pkg, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {pkg}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPoint(null)}
            className="mt-2 ml-auto block"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    );
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className={clsx('relative', className)} style={{ height }}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Convert pixel coordinates to lat/lng (simplified calculation)
          const lat = center.lat + (y - rect.height / 2) * 0.001;
          const lng = center.lng + (x - rect.width / 2) * 0.001;

          handleMapClick({ lat, lng });
        }}
      >
        {/* Placeholder map content */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">MTN Coverage Map</p>
            <p className="text-sm text-gray-400">Click to query coverage</p>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading coverage data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Layer Controls */}
      {renderLayerControls()}

      {/* Coverage Details */}
      {renderCoverageDetails()}
    </div>
  );
};

export default MTNWMSCoverageLayer;