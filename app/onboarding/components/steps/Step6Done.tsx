'use client';
import { PiCheckCircleFill } from 'react-icons/pi';
import { Card, CardContent } from '@/components/ui/card';

export interface Step6DoneProps {
  accountNumber: string;
}

export function Step6Done({ accountNumber }: Step6DoneProps) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <PiCheckCircleFill className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Service order submitted
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your clinic billing setup is in. We've linked it to your Unjani account
          and created your CircleTel account.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="inline-block bg-gray-50 border-2 border-dashed border-gray-300 rounded p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Your account number
            </p>
            <p className="text-3xl font-bold text-gray-900 tracking-widest">
              {accountNumber}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gray-50 border border-gray-200 rounded p-6 text-left max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-3">What happens next</h3>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>We validate your company and director details (CIPC) and your banking.</li>
          <li>We set up your monthly DebiCheck debit order on your chosen payment date.</li>
          <li>
            We issue your CircleTel Service Order — back-to-back with the Unjani Master
            Service Agreement — for signature.
          </li>
          <li>Billing runs monthly in advance from your active service date; your first
            invoice is pro-rated.</li>
          <li>
            <strong>We're vetting your documents.</strong> You'll hear from us within 2
            business days once we've checked everything.
          </li>
        </ol>
      </div>

      <div className="text-sm text-gray-600">
        <p>
          Questions?{' '}
          <a
            href="https://wa.me/27824873900"
            className="font-semibold text-circleTel-orange hover:underline"
          >
            WhatsApp 082 487 3900
          </a>{' '}
          or{' '}
          <a
            href="mailto:contactus@circletel.co.za"
            className="font-semibold text-circleTel-orange hover:underline"
          >
            contactus@circletel.co.za
          </a>
        </p>
      </div>
    </div>
  );
}
