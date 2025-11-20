'use client';

import React, { useState, useMemo } from 'react';
import { PERMISSION_CATEGORIES } from '@/lib/rbac/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Search, CheckSquare, Square } from 'lucide-react';

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Get all permissions as a flat array
  const allPermissions = useMemo(() => {
    return Object.values(PERMISSION_CATEGORIES).flatMap(category => Object.values(category));
  }, []);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return PERMISSION_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Record<string, string>> = {};

    Object.entries(PERMISSION_CATEGORIES).forEach(([categoryName, permissions]) => {
      const matchingPermissions = Object.entries(permissions).filter(([key, value]) =>
        key.toLowerCase().includes(query) ||
        value.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query)
      );

      if (matchingPermissions.length > 0) {
        filtered[categoryName] = Object.fromEntries(matchingPermissions);
      }
    });

    return filtered;
  }, [searchQuery]);

  // Auto-expand categories when searching
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(new Set(Object.keys(filteredCategories)));
    }
  }, [searchQuery, filteredCategories]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle single permission
  const togglePermission = (permission: string) => {
    if (selectedPermissions.includes(permission)) {
      onChange(selectedPermissions.filter(p => p !== permission));
    } else {
      onChange([...selectedPermissions, permission]);
    }
  };

  // Check if all permissions in a category are selected
  const isCategoryFullySelected = (permissions: Record<string, string>) => {
    const categoryPerms = Object.values(permissions);
    return categoryPerms.every(perm => selectedPermissions.includes(perm));
  };

  // Check if some permissions in a category are selected
  const isCategoryPartiallySelected = (permissions: Record<string, string>) => {
    const categoryPerms = Object.values(permissions);
    return categoryPerms.some(perm => selectedPermissions.includes(perm)) &&
      !categoryPerms.every(perm => selectedPermissions.includes(perm));
  };

  // Toggle all permissions in a category
  const toggleCategoryPermissions = (permissions: Record<string, string>) => {
    const categoryPerms = Object.values(permissions);
    const isFullySelected = isCategoryFullySelected(permissions);

    if (isFullySelected) {
      // Deselect all
      onChange(selectedPermissions.filter(p => !categoryPerms.includes(p)));
    } else {
      // Select all
      const newSelected = [...selectedPermissions];
      categoryPerms.forEach(perm => {
        if (!newSelected.includes(perm)) {
          newSelected.push(perm);
        }
      });
      onChange(newSelected);
    }
  };

  // Select/Deselect all permissions
  const toggleAllPermissions = () => {
    if (selectedPermissions.length === allPermissions.length) {
      onChange([]);
    } else {
      onChange(allPermissions);
    }
  };

  const allSelected = selectedPermissions.length === allPermissions.length;
  const someSelected = selectedPermissions.length > 0 && selectedPermissions.length < allPermissions.length;

  return (
    <div className="space-y-4">
      {/* Search and Select All */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={toggleAllPermissions}
            className="data-[state=indeterminate]:bg-primary"
            {...(someSelected ? { 'data-state': 'indeterminate' as any } : {})}
          />
          <Label htmlFor="select-all" className="font-semibold cursor-pointer">
            Select All Permissions ({selectedPermissions.length} / {allPermissions.length})
          </Label>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="border rounded-lg max-h-96 overflow-y-auto">
        {Object.entries(filteredCategories).map(([categoryName, permissions]) => {
          const isExpanded = expandedCategories.has(categoryName);
          const isFullySelected = isCategoryFullySelected(permissions);
          const isPartiallySelected = isCategoryPartiallySelected(permissions);
          const categoryPermCount = Object.keys(permissions).length;
          const selectedCount = Object.values(permissions).filter(p => selectedPermissions.includes(p)).length;

          return (
            <div key={categoryName} className="border-b last:border-b-0">
              {/* Category Header */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryName)}
                  className="p-0 hover:bg-transparent"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </button>

                <Checkbox
                  id={`category-${categoryName}`}
                  checked={isFullySelected}
                  onCheckedChange={() => toggleCategoryPermissions(permissions)}
                  className="data-[state=indeterminate]:bg-primary"
                  {...(isPartiallySelected ? { 'data-state': 'indeterminate' as any } : {})}
                />

                <Label
                  htmlFor={`category-${categoryName}`}
                  className="flex-1 font-medium cursor-pointer"
                  onClick={() => toggleCategory(categoryName)}
                >
                  {categoryName}
                  <span className="ml-2 text-sm text-gray-500">
                    ({selectedCount}/{categoryPermCount})
                  </span>
                </Label>
              </div>

              {/* Category Permissions */}
              {isExpanded && (
                <div className="p-3 pl-10 space-y-2 bg-white">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={selectedPermissions.includes(value)}
                        onCheckedChange={() => togglePermission(value)}
                      />
                      <Label
                        htmlFor={value}
                        className="text-sm cursor-pointer flex-1"
                      >
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {value}
                        </code>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No permissions found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
