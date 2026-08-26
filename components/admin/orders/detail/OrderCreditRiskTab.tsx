'use client';

import { useEffect, useState } from 'react';
import {
  PiShieldCheckBold,
  PiWarningBold,
  PiFloppyDiskBold,
  PiArrowsClockwiseBold,
} from 'react-icons/pi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import {
  creditBadgeVariant,
  creditDecisionLabel,
} from '@/lib/credit-risk/decision';
import { CREDIT_DECISIONS, type CreditDecision, type OrderCreditReview } from '@/lib/credit-risk/types';

interface OrderCreditRiskTabProps {
  orderId: string;
  routerIncluded: boolean;
  initialReview?: OrderCreditReview | null;
  onSaved?: () => void;
}

const EMPTY_REVIEW = {
  decision: 'UNCHECKED' as CreditDecision,
  bureau: 'TransUnion',
  report_id: '',
  transaction_id: '',
  purpose: 'Credit Risk Assessment',
  private_note: '',
  hardware_prepaid: false,
  override_reason: '',
  flags: {
    debt_review: false,
    judgements: false,
    defaults: false,
    sequestration: false,
    admin_order: false,
    no_score: true,
    score: '',
    avs_acc_exists: '',
    avs_id_match: '',
    debt_review_date: '',
  },
};

export function OrderCreditRiskTab({
  orderId,
  routerIncluded,
  initialReview,
  onSaved,
}: OrderCreditRiskTabProps) {
  const [saving, setSaving] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [riskApiConfigured, setRiskApiConfigured] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [form, setForm] = useState(EMPTY_REVIEW);

  useEffect(() => {
    if (!initialReview) return;
    setForm({
      decision: initialReview.decision,
      bureau: initialReview.bureau || 'TransUnion',
      report_id: initialReview.report_id || '',
      transaction_id: initialReview.transaction_id || '',
      purpose: initialReview.purpose || 'Credit Risk Assessment',
      private_note: initialReview.private_note || '',
      hardware_prepaid: Boolean(initialReview.hardware_prepaid),
      override_reason: initialReview.override_reason || '',
      flags: {
        debt_review: Boolean(initialReview.flags?.debt_review),
        judgements: Boolean(initialReview.flags?.judgements),
        defaults: Boolean(initialReview.flags?.defaults),
        sequestration: Boolean(initialReview.flags?.sequestration),
        admin_order: Boolean(initialReview.flags?.admin_order),
        no_score: initialReview.flags?.no_score !== false,
        score: initialReview.flags?.score == null ? '' : String(initialReview.flags.score),
        avs_acc_exists:
          initialReview.flags?.avs_acc_exists == null
            ? ''
            : initialReview.flags.avs_acc_exists
              ? 'yes'
              : 'no',
        avs_id_match:
          initialReview.flags?.avs_id_match == null
            ? ''
            : initialReview.flags.avs_id_match
              ? 'yes'
              : 'no',
        debt_review_date: initialReview.flags?.debt_review_date || '',
      },
    });
  }, [initialReview]);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}/credit-review`)
      .then((res) => res.json())
      .then((json) => setRiskApiConfigured(Boolean(json.riskApiConfigured)))
      .catch(() => setRiskApiConfigured(false));
  }, [orderId]);

  const payloadFlags = () => ({
    debt_review: form.flags.debt_review,
    debt_review_date: form.flags.debt_review_date || null,
    judgements: form.flags.judgements,
    defaults: form.flags.defaults,
    sequestration: form.flags.sequestration,
    admin_order: form.flags.admin_order,
    no_score: form.flags.no_score || form.flags.score === '',
    score: form.flags.score === '' ? null : Number(form.flags.score),
    avs_acc_exists:
      form.flags.avs_acc_exists === '' ? null : form.flags.avs_acc_exists === 'yes',
    avs_id_match: form.flags.avs_id_match === '' ? null : form.flags.avs_id_match === 'yes',
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/credit-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: form.decision,
          bureau: form.bureau,
          report_id: form.report_id,
          transaction_id: form.transaction_id,
          purpose: form.purpose,
          requested_at: new Date().toISOString(),
          flags: payloadFlags(),
          hardware_prepaid: form.hardware_prepaid,
          private_note: form.private_note,
          override_reason: form.override_reason || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');
      toast.success('Credit review saved');
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const pullNetcash = async () => {
    setPulling(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/credit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber, accountNumber: accountNumber || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Netcash pull failed');
      toast.success(`Netcash decision: ${json.data.decision}`);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Netcash pull failed');
    } finally {
      setPulling(false);
    }
  };

  const routerBlocked =
    routerIncluded &&
    (form.decision === 'HARD_FAIL' || form.decision === 'FAIL') &&
    !form.hardware_prepaid;

  return (
    <div className="space-y-5">
      <SectionCard
        title="Credit decision"
        icon={PiShieldCheckBold}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={creditDecisionLabel(form.decision)}
              variant={creditBadgeVariant(form.decision)}
            />
            {routerBlocked ? (
              <StatusBadge status="Router blocked" variant="error" />
            ) : null}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Decision</Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.decision}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, decision: e.target.value as CreditDecision }))
              }
            >
              {CREDIT_DECISIONS.map((decision) => (
                <option key={decision} value={decision}>
                  {creditDecisionLabel(decision)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Bureau</Label>
            <Input
              className="mt-1"
              value={form.bureau}
              onChange={(e) => setForm((prev) => ({ ...prev, bureau: e.target.value }))}
            />
          </div>
          <div>
            <Label>Report id</Label>
            <Input
              className="mt-1"
              value={form.report_id}
              onChange={(e) => setForm((prev) => ({ ...prev, report_id: e.target.value }))}
            />
          </div>
          <div>
            <Label>Transaction id</Label>
            <Input
              className="mt-1"
              value={form.transaction_id}
              onChange={(e) => setForm((prev) => ({ ...prev, transaction_id: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Purpose</Label>
            <Input
              className="mt-1"
              value={form.purpose}
              onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Flags from the Netcash report" icon={PiWarningBold}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ['debt_review', 'Debt review'],
              ['judgements', 'Judgements'],
              ['defaults', 'Defaults'],
              ['sequestration', 'Sequestration'],
              ['admin_order', 'Admin order'],
              ['no_score', 'No bureau score'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox
                checked={Boolean(form.flags[key])}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    flags: { ...prev.flags, [key]: Boolean(checked) },
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Debt review date</Label>
            <Input
              className="mt-1"
              value={form.flags.debt_review_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, debt_review_date: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <Label>Score</Label>
            <Input
              className="mt-1"
              value={form.flags.score}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, score: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <Label>AVS account exists</Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.flags.avs_acc_exists}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, avs_acc_exists: e.target.value },
                }))
              }
            >
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <Label>AVS ID match</Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.flags.avs_id_match}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, avs_id_match: e.target.value },
                }))
              }
            >
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Hardware and alternatives">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox
            checked={form.hardware_prepaid}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, hardware_prepaid: Boolean(checked) }))
            }
          />
          Customer paid hardware in full (required to release a router on HARD_FAIL / FAIL)
        </label>
        <div className="mt-4">
          <Label>Private note (Zoho / sales)</Label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[96px]"
            value={form.private_note}
            onChange={(e) => setForm((prev) => ({ ...prev, private_note: e.target.value }))}
            placeholder="CREDIT: DEBT_REVIEW. No financed router. No 24-month credit. Alternatives only."
          />
        </div>
        <div className="mt-4">
          <Label>Manager override reason</Label>
          <Input
            className="mt-1"
            value={form.override_reason}
            onChange={(e) => setForm((prev) => ({ ...prev, override_reason: e.target.value }))}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Allowed: month-to-month / prepaid service, BYO or customer-paid router.
          Blocked: financed router and 24-month credit unless hardware is prepaid.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving} className="gap-2">
            <PiFloppyDiskBold className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save review'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Refresh from Netcash" icon={PiArrowsClockwiseBold}>
        {riskApiConfigured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>SA ID number</Label>
              <Input className="mt-1" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>
            <div>
              <Label>Bank account (optional AVS)</Label>
              <Input
                className="mt-1"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <Button onClick={pullNetcash} disabled={pulling || !idNumber} className="gap-2">
              {pulling ? 'Pulling…' : 'Pull TransUnion + AVS'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Set <code>NETCASH_RISK_SERVICE_KEY</code> to pull from Netcash. Until then, paste the
            portal report fields above.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
