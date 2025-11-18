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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  AlertCircle,
  Loader2,
  User,
  Calendar,
  Clock,
  Wrench,
  Phone,
  Mail,
} from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
}

interface TechnicianAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
  };
  currentTechnician?: {
    id: string;
    name: string;
  } | null;
  currentScheduledDate?: string | null;
  currentTimeSlot?: string | null;
  onSuccess: () => void;
}

export function TechnicianAssignmentModal({
  open,
  onClose,
  order,
  currentTechnician,
  currentScheduledDate,
  currentTimeSlot,
  onSuccess,
}: TechnicianAssignmentModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('morning');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchTechnicians();
      // Set current values if editing
      if (currentTechnician) {
        setSelectedTechnicianId(currentTechnician.id);
      }
      if (currentScheduledDate) {
        setScheduledDate(currentScheduledDate);
      }
      if (currentTimeSlot) {
        setScheduledTimeSlot(currentTimeSlot);
      }
    }
  }, [open, currentTechnician, currentScheduledDate, currentTimeSlot]);

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const response = await fetch('/api/admin/technicians');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch technicians');
      }

      setTechnicians(result.data || []);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      toast.error('Failed to load technicians');
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedTechnicianId) {
      setError('Please select a technician');
      return;
    }

    if (!scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/orders/${order.id}/installation/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTechnicianId,
          scheduledDate,
          scheduledTimeSlot,
          notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Technician assigned successfully');
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to assign technician');
        toast.error('Assignment failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('Technician assignment error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error', {
        description: 'Failed to connect to server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTechnicianId('');
    setScheduledDate('');
    setScheduledTimeSlot('morning');
    setNotes('');
    setError('');
    onClose();
  };

  const selectedTechnician = technicians.find((t) => t.id === selectedTechnicianId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Assign Technician
            </DialogTitle>
            <DialogDescription>
              Assign a technician to installation for{' '}
              <span className="font-semibold text-gray-900">{order.order_number}</span> -{' '}
              {order.first_name} {order.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Assignment (if exists) */}
            {currentTechnician && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Currently assigned to: <strong>{currentTechnician.name}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Technician Selection */}
            <div className="space-y-2">
              <Label htmlFor="technician">
                Technician <span className="text-red-500">*</span>
              </Label>
              {loadingTechnicians ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                  <SelectTrigger id="technician">
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No technicians available
                      </SelectItem>
                    ) : (
                      technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{tech.name}</span>
                            <span className="text-xs text-gray-500">{tech.phone}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Technician Details */}
            {selectedTechnician && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{selectedTechnician.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {selectedTechnician.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {selectedTechnician.email}
                </div>
                {selectedTechnician.specialties && selectedTechnician.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTechnician.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">
                Scheduled Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <Label htmlFor="time_slot">
                Time Slot <span className="text-red-500">*</span>
              </Label>
              <Select value={scheduledTimeSlot} onValueChange={setScheduledTimeSlot}>
                <SelectTrigger id="time_slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8:00 - 12:00)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12:00 - 17:00)</SelectItem>
                  <SelectItem value="full_day">Full Day (8:00 - 17:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or notes for the technician..."
                rows={3}
              />
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
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingTechnicians}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  {currentTechnician ? 'Reassign Technician' : 'Assign Technician'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
