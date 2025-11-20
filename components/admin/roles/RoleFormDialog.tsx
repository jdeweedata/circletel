'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionSelector } from './PermissionSelector';
import { Loader2, AlertCircle } from 'lucide-react';
import type { RoleTemplate, CreateRoleInput, UpdateRoleInput, RoleDepartment, RoleLevel } from '@/lib/types/role';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleTemplate | null;
  onSuccess: () => void;
}

const DEPARTMENTS: RoleDepartment[] = [
  'Executive',
  'Management',
  'Finance',
  'Product',
  'Operations',
  'Sales',
  'Marketing',
  'Support',
  'IT',
  'General',
];

const LEVELS: RoleLevel[] = ['executive', 'management', 'staff', 'support'];

export function RoleFormDialog({ open, onOpenChange, role, onSuccess }: RoleFormDialogProps) {
  const isEditMode = !!role;

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    department: '' as RoleDepartment,
    level: '' as RoleLevel,
    color: '',
    icon: '',
    permissions: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  // Initialize form data
  useEffect(() => {
    if (role) {
      setFormData({
        id: role.id,
        name: role.name,
        description: role.description,
        department: role.department,
        level: role.level,
        color: role.color || '',
        icon: role.icon || '',
        permissions: role.permissions || [],
      });
    } else {
      // Reset form for create mode
      setFormData({
        id: '',
        name: '',
        description: '',
        department: 'Operations' as RoleDepartment,
        level: 'staff' as RoleLevel,
        color: '',
        icon: '',
        permissions: [],
      });
    }
    setError(null);
    setIdError(null);
  }, [role, open]);

  // Validate ID format (snake_case)
  const validateId = (id: string): boolean => {
    const pattern = /^[a-z][a-z0-9_]*$/;
    if (!pattern.test(id)) {
      setIdError('ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores');
      return false;
    }
    setIdError(null);
    return true;
  };

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'id' && value) {
      validateId(value);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.department) {
      setError('Department is required');
      return;
    }
    if (!formData.level) {
      setError('Level is required');
      return;
    }
    if (formData.permissions.length === 0) {
      setError('At least one permission must be selected');
      return;
    }

    // Validate ID in create mode
    if (!isEditMode) {
      if (!formData.id.trim()) {
        setError('ID is required');
        return;
      }
      if (!validateId(formData.id)) {
        return;
      }
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing role
        const updateData: UpdateRoleInput = {
          name: formData.name,
          description: formData.description,
          department: formData.department,
          level: formData.level,
          permissions: formData.permissions,
          color: formData.color || undefined,
          icon: formData.icon || undefined,
        };

        const response = await fetch(`/api/admin/roles/${role.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update role');
        }

        console.log('✅ Role updated successfully:', result.data);
      } else {
        // Create new role
        const createData: CreateRoleInput = {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          department: formData.department,
          level: formData.level,
          permissions: formData.permissions,
          color: formData.color || undefined,
          icon: formData.icon || undefined,
        };

        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData),
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            setIdError('A role with this ID already exists');
          }
          throw new Error(result.error || 'Failed to create role');
        }

        console.log('✅ Role created successfully:', result.data);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the role template details and permissions.'
              : 'Create a new role template with custom permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* ID Field (Create Mode Only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="id" className="required">
                Role ID
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="e.g., custom_manager"
                required
                className={idError ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500">
                Unique identifier (lowercase, snake_case). Example: custom_manager
              </p>
              {idError && (
                <p className="text-sm text-red-600">{idError}</p>
              )}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="required">
              Role Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Custom Manager"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="required">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the role's responsibilities and purpose"
              rows={3}
              required
            />
          </div>

          {/* Department and Level Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="required">
                Department
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleChange('department', value as RoleDepartment)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level" className="required">
                Level
              </Label>
              <Select
                value={formData.level}
                onValueChange={(value) => handleChange('level', value as RoleLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color and Icon Row (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color (Optional)</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="e.g., blue, #3b82f6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Optional)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="e.g., Shield, Users"
              />
            </div>
          </div>

          {/* Permissions Selector */}
          <div className="space-y-2">
            <Label className="required">
              Permissions ({formData.permissions.length} selected)
            </Label>
            <PermissionSelector
              selectedPermissions={formData.permissions}
              onChange={(permissions) => handleChange('permissions', permissions)}
            />
          </div>

          {/* Dialog Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
