'use client';

import { useState, useEffect } from 'react';
import { PiNotePencilBold, PiCheckBold, PiXBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SectionCard } from '@/components/admin/shared';

interface DeviceSupportNotesProps {
  sn: string;
}

export function DeviceSupportNotes({ sn }: DeviceSupportNotesProps) {
  const [notes, setNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [sn]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/notes`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setNotes(data.notes || '');
      setOriginalNotes(data.notes || '');
      setUpdatedBy(data.updated_by);
      setUpdatedAt(data.updated_at);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
        credentials: 'include',
      });
      if (response.ok) {
        setOriginalNotes(notes);
        setEditing(false);
        fetchNotes(); // Refresh to get updated_by
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(originalNotes);
    setEditing(false);
  };

  if (loading) {
    return (
      <SectionCard icon={PiNotePencilBold} title="Support Notes" compact>
        <div className="h-24 bg-slate-100 animate-pulse rounded" />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={PiNotePencilBold}
      title="Support Notes"
      action={
        !editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null
      }
      compact
    >
      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this device..."
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <PiXBold className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <PiCheckBold className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No notes yet. Click Edit to add.</p>
          )}
          {updatedBy && updatedAt && (
            <p className="text-xs text-slate-400 mt-3">
              Last updated by {updatedBy} on {new Date(updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
