'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, X, Plus, GripVertical } from 'lucide-react';

interface FeaturesEditorProps {
  features: string[];
  onChange: (features: string[]) => void;
}

export function FeaturesEditor({ features, onChange }: FeaturesEditorProps) {
  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      onChange([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  const moveFeature = (from: number, to: number) => {
    if (to < 0 || to >= features.length) return;
    const updated = [...features];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onChange(updated);
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...features];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Product Features</Label>
        <span className="text-sm text-muted-foreground">
          {features.length} {features.length === 1 ? 'feature' : 'features'}
        </span>
      </div>

      {/* Features List */}
      {features.length > 0 ? (
        <div className="space-y-2 border rounded-md p-4 bg-muted/20">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 group">
              {/* Drag Handle */}
              <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Move Buttons */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => moveFeature(index, index - 1)}
                  disabled={index === 0}
                  type="button"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => moveFeature(index, index + 1)}
                  disabled={index === features.length - 1}
                  type="button"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Feature Input */}
              <Input
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                className="flex-1"
                placeholder="Feature description..."
              />

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => removeFeature(index)}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground bg-muted/20">
          <p className="text-sm">No features added yet</p>
          <p className="text-xs mt-1">Add your first feature below</p>
        </div>
      )}

      {/* Add New Feature */}
      <div className="flex gap-2">
        <Input
          placeholder="Add new feature (e.g., '200Mbps symmetrical speed')"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFeature();
            }
          }}
          className="flex-1"
        />
        <Button onClick={addFeature} type="button" disabled={!newFeature.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">Enter</kbd> or click Add button to add a feature
      </p>
    </div>
  );
}
