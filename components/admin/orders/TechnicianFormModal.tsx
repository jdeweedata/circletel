'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Wrench, Plus, X } from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  notes: string | null;
}

interface TechnicianFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  technician?: Technician | null;
}

const COMMON_SPECIALTIES = [
  'Fiber',
  'Wireless',
  'LTE',
  '5G',
  'FTTB',
  'FTTH',
  'VDSL',
  'Router Configuration',
  'Network Setup',
  'Business Installation',
];

export function TechnicianFormModal({
  open,
  onClose,
  onSuccess,
  technician,
}: TechnicianFormModalProps) {
  const isEditing = !!technician;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    notes: '',
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && technician) {
      setFormData({
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        specialties: technician.specialties || [],
        notes: technician.notes || '',
      });
    } else if (open && !technician) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        notes: '',
      });
    }
  }, [open, technician]);

  const handleAddSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
    }
    setNewSpecialty('');
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const url = isEditing
        ? `/api/admin/technicians/${technician.id}`
        : '/api/admin/technicians';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          specialties: formData.specialties,
          notes: formData.notes.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.message || `Technician ${isEditing ? 'updated' : 'created'} successfully`
        );
        onSuccess();
        handleClose();
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} technician`);
        toast.error(result.error || 'Operation failed');
      }
    } catch (err) {
      console.error('Technician form error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialties: [],
      notes: '',
    });
    setNewSpecialty('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-circleTel-orange" />
              {isEditing ? 'Edit Technician' : 'Add New Technician'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Update information for ${technician.name}`
                : 'Enter the details for the new technician'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27 12 345 6789"
                required
              />
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label>Specialties</Label>

              {/* Current Specialties */}
              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
                  {formData.specialties.map((specialty) => (
                    <Badge
                      key={specialty}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(specialty)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Common Specialties */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SPECIALTIES.filter((s) => !formData.specialties.includes(s)).map(
                    (specialty) => (
                      <Button
                        key={specialty}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSpecialty(specialty)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {specialty}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Custom Specialty */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom specialty..."
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialty(newSpecialty);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddSpecialty(newSpecialty)}
                  disabled={!newSpecialty.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any internal notes about this technician..."
                rows={3}
              />
              <p className="text-xs text-gray-500">
                These notes are only visible to admin users
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Technician' : 'Create Technician'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
