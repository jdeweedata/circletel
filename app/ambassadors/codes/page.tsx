'use client';
import { PiArrowSquareOutBold, PiCheckBold, PiCopyBold, PiCurrencyDollarBold, PiCursorClickBold, PiPencilSimpleBold, PiPlusBold, PiShoppingCartBold, PiSpinnerBold, PiTrashBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AmbassadorCode {
  id: string;
  code: string;
  label: string | null;
  discount_type: string | null;
  discount_value: number;
  total_clicks: number;
  unique_clicks: number;
  total_conversions: number;
  total_revenue: number;
  destination_url: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function AmbassadorCodesPage() {
  const supabase = createClient();

  const [codes, setCodes] = useState<AmbassadorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [ambassadorId, setAmbassadorId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<AmbassadorCode | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    destination_url: '/',
  });

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get ambassador
        const { data: ambassador } = await supabase
          .from('ambassadors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!ambassador) return;

        setAmbassadorId(ambassador.id);

        // Fetch codes
        const { data } = await supabase
          .from('ambassador_codes')
          .select('*')
          .eq('ambassador_id', ambassador.id)
          .order('created_at', { ascending: false });

        setCodes(data || []);
      } catch (error) {
        console.error('Error fetching codes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, [supabase]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const openCreateModal = () => {
    setEditingCode(null);
    setFormData({
      code: generateCode(),
      label: '',
      destination_url: '/',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (code: AmbassadorCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      label: code.label || '',
      destination_url: code.destination_url,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!ambassadorId || !formData.code) return;

    try {
      setSaving(true);

      const payload = {
        ambassador_id: ambassadorId,
        code: formData.code.toUpperCase(),
        label: formData.label || null,
        destination_url: formData.destination_url || '/',
      };

      if (editingCode) {
        // Update
        const { error } = await supabase
          .from('ambassador_codes')
          .update(payload)
          .eq('id', editingCode.id);

        if (error) throw error;

        setCodes(
          codes.map((c) =>
            c.id === editingCode.id ? { ...c, ...payload } : c
          )
        );
      } else {
        // Create
        const { data, error } = await supabase
          .from('ambassador_codes')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        setCodes([data, ...codes]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving code:', error);
      alert('Failed to save code. It may already exist.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ambassador_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCodes(codes.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting code:', error);
    }
  };

  const toggleActive = async (code: AmbassadorCode) => {
    try {
      const { error } = await supabase
        .from('ambassador_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id);

      if (error) throw error;

      setCodes(
        codes.map((c) =>
          c.id === code.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    } catch (error) {
      console.error('Error toggling code:', error);
    }
  };

  const copyToClipboard = async (code: string) => {
    const trackingUrl = `${window.location.origin}/t/${code}`;
    await navigator.clipboard.writeText(trackingUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Referral Codes</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your tracking codes
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <PiPlusBold className="w-4 h-4 mr-2" />
          New Code
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Share your tracking link{' '}
          <code className="bg-blue-100 px-1 rounded">circletel.co.za/t/YOUR_CODE</code>{' '}
          and earn commission on every signup that converts to a paying customer.
        </p>
      </div>

      {/* Codes Grid */}
      {codes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PiPlusBold className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No codes yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first referral code to start tracking clicks and earning
            commissions.
          </p>
          <Button onClick={openCreateModal}>
            <PiPlusBold className="w-4 h-4 mr-2" />
            Create Your First Code
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((code) => (
            <div
              key={code.id}
              className={cn(
                'bg-white rounded-xl border p-5 transition-all',
                !code.is_active && 'opacity-60'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <code className="text-lg font-mono font-bold text-gray-900">
                    {code.code}
                  </code>
                  {code.label && (
                    <p className="text-sm text-gray-500">{code.label}</p>
                  )}
                </div>
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    code.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {code.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <PiCursorClickBold className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-sm font-semibold">{code.total_clicks}</p>
                  <p className="text-xs text-gray-500">Clicks</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <PiShoppingCartBold className="w-4 h-4 mx-auto text-green-500 mb-1" />
                  <p className="text-sm font-semibold">{code.total_conversions}</p>
                  <p className="text-xs text-gray-500">Sales</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <PiCurrencyDollarBold className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-sm font-semibold">R{code.total_revenue.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(code.code)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    copiedCode === code.code
                      ? 'bg-green-100 text-green-700'
                      : 'bg-circleTel-orange/10 text-circleTel-orange hover:bg-circleTel-orange/20'
                  )}
                >
                  {copiedCode === code.code ? (
                    <>
                      <PiCheckBold className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <PiCopyBold className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => openEditModal(code)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Edit"
                >
                  <PiPencilSimpleBold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(code)}
                  className={cn(
                    'p-2 rounded-lg',
                    code.is_active
                      ? 'text-gray-500 hover:bg-gray-100'
                      : 'text-green-600 hover:bg-green-50'
                  )}
                  title={code.is_active ? 'Deactivate' : 'Activate'}
                >
                  <PiArrowSquareOutBold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(code.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <PiTrashBold className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Edit Code' : 'Create New Code'}
            </DialogTitle>
            <DialogDescription>
              {editingCode
                ? 'Update your referral code settings.'
                : 'Create a unique code to share with your audience.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., JOHN20"
                  className="font-mono"
                  disabled={!!editingCode} // Can't change code after creation
                />
                {!editingCode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({ ...formData, code: generateCode() })
                    }
                  >
                    Generate
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your tracking URL will be: circletel.co.za/t/{formData.code || '...'}
              </p>
            </div>

            <div>
              <Label htmlFor="label">Label (Optional)</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                placeholder="e.g., Instagram Bio, YouTube Description"
              />
              <p className="text-xs text-gray-500 mt-1">
                A friendly name to help you remember where this code is used.
              </p>
            </div>

            <div>
              <Label htmlFor="destination">Destination URL</Label>
              <Input
                id="destination"
                value={formData.destination_url}
                onChange={(e) =>
                  setFormData({ ...formData, destination_url: e.target.value })
                }
                placeholder="/"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where to send visitors after tracking. Default: Homepage
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.code}>
              {saving ? (
                <>
                  <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingCode ? (
                'Save Changes'
              ) : (
                'Create Code'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this code? This action cannot be
              undone and you will lose all tracking history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
