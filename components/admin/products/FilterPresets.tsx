'use client';

import { useState, useEffect } from 'react';
import { ProductFilters } from '@/lib/types/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bookmark, Plus, Trash2 } from 'lucide-react';

interface FilterPreset {
  id: string;
  name: string;
  filters: ProductFilters;
  isDefault: boolean;
}

interface FilterPresetsProps {
  currentFilters: ProductFilters;
  onApplyPreset: (filters: ProductFilters) => void;
}

const BUILT_IN_PRESETS: FilterPreset[] = [
  {
    id: 'active-business',
    name: 'Active Business Products',
    filters: { status: 'active', category: 'connectivity' },
    isDefault: true,
  },
  {
    id: 'featured-products',
    name: 'Featured Products',
    filters: { is_featured: true as any },
    isDefault: true,
  },
  {
    id: 'popular-products',
    name: 'Popular Products',
    filters: { is_popular: true as any },
    isDefault: true,
  },
  {
    id: 'draft-products',
    name: 'Draft Products',
    filters: { status: 'draft' },
    isDefault: true,
  },
  {
    id: 'fibre-products',
    name: 'Fibre Products',
    filters: { technology: 'fibre' },
    isDefault: true,
  },
];

export function FilterPresets({ currentFilters, onApplyPreset }: FilterPresetsProps) {
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('product-filter-presets');
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    }
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const preset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      filters: currentFilters,
      isDefault: false,
    };

    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    localStorage.setItem('product-filter-presets', JSON.stringify(updated));

    setIsCreating(false);
    setNewPresetName('');
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updated);
    localStorage.setItem('product-filter-presets', JSON.stringify(updated));
  };

  const activeFilterCount = Object.values(currentFilters).filter(
    v => v !== undefined && v !== null && v !== ''
  ).length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Presets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Built-in Presets</DropdownMenuLabel>
          {BUILT_IN_PRESETS.map(preset => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onApplyPreset(preset.filters)}
            >
              {preset.name}
            </DropdownMenuItem>
          ))}

          {customPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>My Presets</DropdownMenuLabel>
              {customPresets.map(preset => (
                <DropdownMenuItem
                  key={preset.id}
                  className="flex items-center justify-between group"
                  onClick={() => onApplyPreset(preset.filters)}
                >
                  <span>{preset.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Active 5G Products"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset();
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-500">
              Current filters: {activeFilterCount} active
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewPresetName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
