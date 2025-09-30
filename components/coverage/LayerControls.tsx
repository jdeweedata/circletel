'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Layers,
  Eye,
  EyeOff,
  Settings,
  Wifi,
  Smartphone,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { ServiceType } from '@/lib/coverage/types';
import { SERVICE_TYPE_MAPPING } from '@/lib/coverage/mtn/types';

export interface LayerConfig {
  serviceType: ServiceType;
  enabled: boolean;
  opacity: number;
  layer: string;
  source: 'business' | 'consumer';
  priority: number;
}

interface LayerControlsProps {
  layers: LayerConfig[];
  onLayerToggle: (serviceType: ServiceType) => void;
  onOpacityChange: (serviceType: ServiceType, opacity: number) => void;
  onLayerOrderChange?: (layers: LayerConfig[]) => void;
  showAdvancedControls?: boolean;
}

interface LayerGroup {
  name: string;
  icon: React.ReactNode;
  layers: LayerConfig[];
  color: string;
}

export default function LayerControls({
  layers,
  onLayerToggle,
  onOpacityChange,
  onLayerOrderChange,
  showAdvancedControls = false
}: LayerControlsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['business']));
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedControls);

  // Group layers by source
  const layerGroups: LayerGroup[] = [
    {
      name: 'Business Services',
      icon: <Building2 className="h-4 w-4" />,
      layers: layers.filter(layer => layer.source === 'business'),
      color: 'orange'
    },
    {
      name: 'Consumer Services',
      icon: <Users className="h-4 w-4" />,
      layers: layers.filter(layer => layer.source === 'consumer'),
      color: 'blue'
    }
  ];

  const toggleGroupExpanded = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const getServiceTypeInfo = (serviceType: ServiceType) => {
    return SERVICE_TYPE_MAPPING[serviceType] || {
      name: serviceType.replace('_', ' '),
      description: 'Coverage information',
      category: 'Other',
      color: '#6b7280',
      priority: 999
    };
  };

  const getSignalIcon = (serviceType: ServiceType) => {
    if (serviceType.includes('5g') || serviceType.includes('lte')) {
      return <Smartphone className="h-3 w-3" />;
    }
    return <Wifi className="h-3 w-3" />;
  };

  const enabledLayersCount = layers.filter(layer => layer.enabled).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Coverage Layers
            <Badge variant="outline" className="text-xs">
              {enabledLayersCount} active
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => layers.forEach(layer => !layer.enabled && onLayerToggle(layer.serviceType))}
            disabled={enabledLayersCount === layers.length}
          >
            <Eye className="h-3 w-3 mr-1" />
            Show All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => layers.forEach(layer => layer.enabled && onLayerToggle(layer.serviceType))}
            disabled={enabledLayersCount === 0}
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Hide All
          </Button>
        </div>

        <Separator />

        {/* Layer Groups */}
        {layerGroups.map(group => (
          <div key={group.name} className="space-y-2">
            <button
              onClick={() => toggleGroupExpanded(group.name)}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {group.icon}
                <span className="font-medium text-sm">{group.name}</span>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: group.color === 'orange' ? '#f97316' : '#3b82f6',
                    color: group.color === 'orange' ? '#f97316' : '#3b82f6'
                  }}
                >
                  {group.layers.filter(l => l.enabled).length}/{group.layers.length}
                </Badge>
              </div>
              {expandedGroups.has(group.name) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedGroups.has(group.name) && (
              <div className="space-y-3 pl-4">
                {group.layers.map(layer => {
                  const serviceInfo = getServiceTypeInfo(layer.serviceType);
                  return (
                    <div key={layer.serviceType} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {getSignalIcon(layer.serviceType)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {serviceInfo.name}
                              </span>
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: serviceInfo.color }}
                              />
                            </div>
                            {showAdvanced && (
                              <p className="text-xs text-gray-600 mt-1">
                                {serviceInfo.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={layer.enabled}
                          onCheckedChange={() => onLayerToggle(layer.serviceType)}
                        />
                      </div>

                      {layer.enabled && (
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-16">Opacity</span>
                            <Slider
                              value={[layer.opacity * 100]}
                              onValueChange={([value]) => onOpacityChange(layer.serviceType, value / 100)}
                              max={100}
                              min={10}
                              step={10}
                              className="flex-1"
                            />
                            <span className="text-xs text-gray-600 w-10">
                              {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>

                          {showAdvanced && (
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Layer: {layer.layer}</div>
                              <div>Source: {layer.source}</div>
                              <div>Priority: {serviceInfo.priority}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {showAdvanced && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Layer Information
              </h4>
              <div className="text-xs text-gray-600 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium mb-1">Business Layers</div>
                    <div className="space-y-1">
                      <div>• Fibre (FTTB)</div>
                      <div>• Fixed LTE</div>
                      <div>• Uncapped Wireless</div>
                      <div>• Licensed Wireless</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Consumer Layers</div>
                    <div className="space-y-1">
                      <div>• 5G Coverage</div>
                      <div>• LTE Coverage</div>
                      <div>• 3G (900MHz/2100MHz)</div>
                      <div>• 2G (GSM)</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="font-medium mb-1">Signal Strength</div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      Excellent
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      Good
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full" />
                      Fair
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      Poor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}