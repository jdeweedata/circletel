/**
 * Real-time Signal Strength Visualization Component
 *
 * Displays MTN signal strength data as an interactive heatmap overlay
 * with real-time updates, filtering controls, and detailed statistics.
 *
 * Features:
 * - Interactive heatmap visualization
 * - Real-time signal strength monitoring
 * - Technology-specific filtering
 * - Signal quality statistics
 * - Performance-optimized rendering
 * - Responsive design with mobile support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Signal, Zap, Smartphone, BarChart3, Play, Pause, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useMTNSignalStrength, getSignalStrengthColor, getSignalQualityLabel, calculateViewportBounds } from '@/hooks/useMTNSignalStrength';
import clsx from 'clsx';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface SignalStrengthVisualizationProps {
  /** Map center coordinates */
  center: { lat: number; lng: number };
  /** Map zoom level */
  zoom: number;
  /** Container height */
  height?: string;
  /** Enable real-time updates by default */
  defaultRealTime?: boolean;
  /** Technologies to display */
  technologies?: Array<'4G' | '5G' | 'LTE'>;
  /** Component CSS class */
  className?: string;
  /** Loading state callback */
  onLoadingChange?: (loading: boolean) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

interface TechnologyToggle {
  '4G': boolean;
  '5G': boolean;
  'LTE': boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const TECHNOLOGY_CONFIG = {
  '4G': {
    color: '#3B82F6',
    icon: Signal,
    label: '4G Coverage',
    description: 'Standard 4G mobile broadband'
  },
  '5G': {
    color: '#8B5CF6',
    icon: Zap,
    label: '5G Coverage',
    description: 'Next-generation 5G network'
  },
  'LTE': {
    color: '#10B981',
    icon: Smartphone,
    label: 'LTE Coverage',
    description: 'LTE mobile network'
  }
} as const;

// =============================================================================
// Main Component
// =============================================================================

export const SignalStrengthVisualization: React.FC<SignalStrengthVisualizationProps> = ({
  center,
  zoom,
  height = '500px',
  defaultRealTime = true,
  technologies = ['4G', '5G', 'LTE'],
  className,
  onLoadingChange,
  onError
}) => {
  // State management
  const [activeTechnologies, setActiveTechnologies] = useState<TechnologyToggle>({
    '4G': technologies.includes('4G'),
    '5G': technologies.includes('5G'),
    'LTE': technologies.includes('LTE')
  });
  const [showStatistics, setShowStatistics] = useState(true);
  const [signalFilter, setSignalFilter] = useState({ min: 0, max: 100 });

  // Calculate viewport bounds
  const bounds = calculateViewportBounds(center, zoom);

  // Get active technologies list
  const activeTechiList = Object.entries(activeTechnologies)
    .filter(([, enabled]) => enabled)
    .map(([tech]) => tech as '4G' | '5G' | 'LTE');

  // Signal strength hook
  const {
    signalPoints,
    statistics,
    lastUpdate,
    isLoading,
    isError,
    error,
    isRealTimeActive,
    toggleRealTimeUpdates,
    manualRefresh,
    getPointsByTechnology,
    getPointsBySignalRange
  } = useMTNSignalStrength({
    bounds,
    technologies: activeTechiList,
    refreshInterval: 30000,
    maxDataPoints: 50,
    realTimeUpdates: defaultRealTime
  });

  // =============================================================================
  // Effects
  // =============================================================================

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (isError && error) {
      onError?.(error);
    }
  }, [isError, error, onError]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleTechnologyToggle = useCallback((tech: '4G' | '5G' | 'LTE', enabled: boolean) => {
    setActiveTechnologies(prev => ({
      ...prev,
      [tech]: enabled
    }));
  }, []);

  const handleRealTimeToggle = useCallback((enabled: boolean) => {
    toggleRealTimeUpdates(enabled);
  }, [toggleRealTimeUpdates]);

  // =============================================================================
  // Data Processing
  // =============================================================================

  // Filter points by signal strength and active technologies
  const filteredPoints = signalPoints.filter(point => {
    const technologyActive = activeTechnologies[point.technology];
    const signalInRange = point.signalStrength >= signalFilter.min && point.signalStrength <= signalFilter.max;
    return technologyActive && signalInRange;
  });

  // =============================================================================
  // Render Methods
  // =============================================================================

  /**
   * Render control panel
   */
  const renderControls = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5" />
          Signal Strength Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-time controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Real-time Updates</span>
            {lastUpdate && (
              <span className="text-xs text-gray-500">
                Last: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isRealTimeActive}
              onCheckedChange={handleRealTimeToggle}
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={manualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Technology toggles */}
        <div className="space-y-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Technologies
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(TECHNOLOGY_CONFIG) as Array<[keyof typeof TECHNOLOGY_CONFIG, typeof TECHNOLOGY_CONFIG[keyof typeof TECHNOLOGY_CONFIG]]>).map(([tech, config]) => {
              const Icon = config.icon;
              const isActive = activeTechnologies[tech];
              const pointCount = getPointsByTechnology(tech).length;

              return (
                <div
                  key={tech}
                  className={clsx(
                    'p-2 rounded-lg border cursor-pointer transition-colors',
                    isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  )}
                  onClick={() => handleTechnologyToggle(tech, !isActive)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? config.color : '#6B7280' }}
                    />
                    <span className="text-sm font-medium">{tech}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {pointCount} points
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  /**
   * Render statistics panel
   */
  const renderStatistics = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5" />
            Coverage Statistics
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStatistics(!showStatistics)}
          >
            {showStatistics ? 'Hide' : 'Show'}
          </Button>
        </CardTitle>
      </CardHeader>
      {showStatistics && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Data Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.averageSignal}%
              </div>
              <div className="text-sm text-gray-600">Avg Signal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.coveragePercentage}%
              </div>
              <div className="text-sm text-gray-600">Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.strongSignalPercentage}%
              </div>
              <div className="text-sm text-gray-600">Strong Signal</div>
            </div>
          </div>

          {/* Active technologies */}
          <div>
            <div className="text-sm font-medium mb-2">Active Technologies</div>
            <div className="flex gap-1 flex-wrap">
              {statistics.technologiesActive.map(tech => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: TECHNOLOGY_CONFIG[tech as keyof typeof TECHNOLOGY_CONFIG].color + '20' }}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  /**
   * Render signal strength heatmap
   */
  const renderHeatmap = () => (
    <Card>
      <CardContent className="p-0">
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{ height }}
        >
          {/* Heatmap visualization */}
          <div className="absolute inset-0">
            {filteredPoints.map((point, index) => {
              const x = ((point.lng - bounds.west) / (bounds.east - bounds.west)) * 100;
              const y = ((bounds.north - point.lat) / (bounds.north - bounds.south)) * 100;

              return (
                <div
                  key={point.id}
                  className="absolute w-8 h-8 rounded-full opacity-70 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-150 hover:opacity-90"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: getSignalStrengthColor(point.signalStrength),
                    zIndex: 10 + Math.floor(point.signalStrength / 10)
                  }}
                  title={`${point.technology}: ${point.signalStrength}% (${point.speedEstimate} Mbps)`}
                />
              );
            })}
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading signal data...</span>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {isError && (
            <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-600 font-medium mb-2">Failed to load signal data</div>
                <Button variant="outline" size="sm" onClick={manualRefresh}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Signal strength legend */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg p-2 shadow-lg">
            <div className="text-xs font-medium mb-2">Signal Strength</div>
            <div className="space-y-1">
              {[
                { label: 'Excellent', color: getSignalStrengthColor(90), range: '80-100%' },
                { label: 'Good', color: getSignalStrengthColor(70), range: '60-79%' },
                { label: 'Fair', color: getSignalStrengthColor(50), range: '40-59%' },
                { label: 'Poor', color: getSignalStrengthColor(30), range: '20-39%' },
                { label: 'None', color: getSignalStrengthColor(10), range: '0-19%' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">
                    {item.label} ({item.range})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className={clsx('space-y-4', className)}>
      {renderControls()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {renderHeatmap()}
        </div>
        <div>
          {renderStatistics()}
        </div>
      </div>
    </div>
  );
};

export default SignalStrengthVisualization;