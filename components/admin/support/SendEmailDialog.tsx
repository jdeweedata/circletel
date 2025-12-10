'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SendEmailDialogProps {
  // Pre-fill values
  defaultTo?: string;
  defaultCc?: string;
  defaultSubject?: string;
  defaultBody?: string;
  // Related entities for logging
  customerId?: string;
  orderId?: string;
  // Trigger customization
  trigger?: React.ReactNode;
  triggerClassName?: string;
}

export function SendEmailDialog({
  defaultTo = '',
  defaultCc = '',
  defaultSubject = '',
  defaultBody = '',
  customerId,
  orderId,
  trigger,
  triggerClassName,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState(defaultCc);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error('Recipient email is required');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Email body is required');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/admin/support/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.split(',').map(e => e.trim()).filter(Boolean),
          cc: cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : undefined,
          subject,
          body,
          customerId,
          orderId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast.success(`Email sent to ${to}`);
      setOpen(false);
      
      // Reset form
      setTo(defaultTo);
      setCc(defaultCc);
      setSubject(defaultSubject);
      setBody(defaultBody);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={triggerClassName}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Support Email</DialogTitle>
          <DialogDescription>
            Send an email to the customer. The email will be sent from support@circletel.co.za.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              placeholder="customer@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cc">CC</Label>
            <Input
              id="cc"
              type="text"
              placeholder="cc@example.com (optional)"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="RE: Your CircleTel Account"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              placeholder="Hi [Customer Name],&#10;&#10;Thank you for contacting CircleTel Support...&#10;&#10;Kind Regards,&#10;CircleTel Support"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Plain text or HTML supported. Signature will be added automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
