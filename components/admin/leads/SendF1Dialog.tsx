'use client';

import { useState } from 'react';
import { PiWhatsappLogoBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SendF1DialogProps {
  onSent?: () => void;
}

export function SendF1Dialog({ onSent }: SendF1DialogProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [campaign, setCampaign] = useState('');
  const [entrySource, setEntrySource] = useState('admin');
  const [useTemplate, setUseTemplate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSend() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/whatsapp/flows/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          customer_name: customerName.trim() || undefined,
          entry_source: entrySource,
          source_campaign: campaign.trim() || `admin-${entrySource}`,
          use_template: useTemplate,
          draft: false,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Send failed (${res.status})`);
      }

      setSuccess(
        useTemplate
          ? 'Cold template delivered. Customer should see “Get started” on WhatsApp.'
          : 'Interactive Flow sent (requires open 24h chat window).'
      );
      setPhone('');
      setCustomerName('');
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSubmitting(false);
    }
  }

  const canSend = phone.replace(/\D/g, '').length >= 10 && !submitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#16A34A] hover:bg-[#15803d] text-white">
          <PiWhatsappLogoBold className="h-4 w-4 mr-2" aria-hidden="true" />
          Send F1 form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send WhatsApp lead form (F1)</DialogTitle>
          <DialogDescription>
            Sends the published lead-qualification Flow. Use cold template for new
            numbers (outside 24h window).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Customer name (greeting)
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Vinesh"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              WhatsApp number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="065 895 6080"
              type="tel"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Campaign tag
            </label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. partner-qr-june"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Entry source
            </label>
            <Select value={entrySource} onValueChange={setEntrySource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="qr">qr</SelectItem>
                <SelectItem value="website">website</SelectItem>
                <SelectItem value="manual">manual</SelectItem>
                <SelectItem value="ctwa_ad">ctwa_ad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="rounded border-gray-300"
            />
            Cold send (MARKETING template) — required if they haven’t messaged us recently
          </label>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-green-700" role="status">
              {success}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Close
          </Button>
          <Button onClick={handleSend} disabled={!canSend}>
            {submitting ? 'Sending…' : 'Send form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
