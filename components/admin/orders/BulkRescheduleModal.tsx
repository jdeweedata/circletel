'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';

interface BulkRescheduleModalProps {
  selectedCount: number;
  onReschedule: (newDate: string, newTimeSlot: string) => Promise<void>;
  isRescheduling: boolean;
}

export function BulkRescheduleModal({
  selectedCount,
  onReschedule,
  isRescheduling,
}: BulkRescheduleModalProps) {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('morning');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newDate) {
      setError('Please select a new date');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('Cannot schedule in the past');
      return;
    }

    await onReschedule(newDate, newTimeSlot);
    handleClose();
  };

  const handleClose = () => {
    setNewDate('');
    setNewTimeSlot('morning');
    setError('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Reschedule {selectedCount} Installation{selectedCount > 1 ? 's' : ''}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bulk Reschedule
            </DialogTitle>
            <DialogDescription>
              Reschedule {selectedCount} selected installation{selectedCount > 1 ? 's' : ''} to a
              new date and time slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning Message */}
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                This will reschedule all {selectedCount} selected installations to the same date and
                time slot.
              </AlertDescription>
            </Alert>

            {/* New Date */}
            <div className="space-y-2">
              <Label htmlFor="new_date">
                New Scheduled Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new_date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <Label htmlFor="time_slot">
                Time Slot <span className="text-red-500">*</span>
              </Label>
              <Select value={newTimeSlot} onValueChange={setNewTimeSlot}>
                <SelectTrigger id="time_slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Morning (8:00 - 12:00)
                    </div>
                  </SelectItem>
                  <SelectItem value="afternoon">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Afternoon (12:00 - 17:00)
                    </div>
                  </SelectItem>
                  <SelectItem value="full_day">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Full Day (8:00 - 17:00)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isRescheduling}>
              Cancel
            </Button>
            <Button type="submit" disabled={isRescheduling}>
              {isRescheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Reschedule All
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
