'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import type { RoleWithUserCount } from '@/lib/types/role';

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithUserCount | null;
  onSuccess: () => void;
}

export function DeleteRoleDialog({ open, onOpenChange, role, onSuccess }: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAssignedUsers = role && role.user_count > 0;

  const handleDelete = async () => {
    if (!role) return;

    // Prevent deletion if users are assigned
    if (hasAssignedUsers) {
      setError(`Cannot delete this role because ${role.user_count} user(s) are currently assigned to it. Please reassign these users before deleting.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to delete role');
      }

      console.log('✅ Role deleted successfully:', role.name);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the role');
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Role</span>
          </DialogTitle>
          <DialogDescription>
            This action will deactivate the role template. This action can be reversed by a database administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
            <div>
              <p className="text-sm text-gray-500">Role Name</p>
              <p className="font-semibold">{role.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role ID</p>
              <p className="text-sm font-mono bg-white px-2 py-1 rounded inline-block">
                {role.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p>{role.department}</p>
            </div>
          </div>

          {/* User Count Warning */}
          {hasAssignedUsers ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <div className="flex items-start space-x-2">
                <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Cannot Delete Role</p>
                  <p className="text-sm mt-1">
                    This role is currently assigned to <strong>{role.user_count}</strong> active user(s).
                    Please reassign these users to another role before deleting this role template.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Warning</p>
                  <p className="text-sm mt-1">
                    Are you sure you want to delete this role? This will mark the role as inactive
                    and it will no longer be available for assignment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || hasAssignedUsers}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasAssignedUsers ? 'Cannot Delete' : 'Delete Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
