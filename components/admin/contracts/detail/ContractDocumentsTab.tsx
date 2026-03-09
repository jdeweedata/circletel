'use client';

import {
  PiFileTextBold,
  PiDownloadSimpleBold,
  PiEyeBold,
  PiCheckCircleBold,
  PiClockBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/admin/shared';
import { cn } from '@/lib/utils';

interface ContractDocumentsTabProps {
  contract: {
    id: string;
    contract_number: string;
    pdf_url: string | null;
    signed_pdf_url: string | null;
    status: string;
    fully_signed_date: string | null;
  };
}

export function ContractDocumentsTab({ contract }: ContractDocumentsTabProps) {
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  const documents = [
    {
      id: 'contract-pdf',
      title: 'Service Contract',
      description: `${contract.contract_number}.pdf`,
      url: contract.pdf_url,
      type: 'primary',
      isSigned: false,
    },
    {
      id: 'signed-pdf',
      title: 'Signed Contract',
      description: contract.fully_signed_date
        ? `Signed on ${new Date(contract.fully_signed_date).toLocaleDateString('en-ZA')}`
        : 'Awaiting signatures',
      url: contract.signed_pdf_url,
      type: 'signed',
      isSigned: !!contract.signed_pdf_url,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Contract Documents" icon={PiFileTextBold}>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'flex items-center justify-between p-4 border rounded-lg',
                doc.url ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50'
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'h-12 w-12 rounded-lg flex items-center justify-center',
                    doc.isSigned ? 'bg-emerald-50' : doc.url ? 'bg-blue-50' : 'bg-slate-100'
                  )}
                >
                  {doc.isSigned ? (
                    <PiCheckCircleBold className="h-6 w-6 text-emerald-600" />
                  ) : doc.url ? (
                    <PiFileTextBold className="h-6 w-6 text-blue-600" />
                  ) : (
                    <PiClockBold className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{doc.title}</p>
                  <p className="text-sm text-slate-500">{doc.description}</p>
                </div>
              </div>

              {doc.url ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(doc.url!)}
                    className="gap-2"
                  >
                    <PiEyeBold className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(doc.url!, `${contract.contract_number}${doc.isSigned ? '-signed' : ''}.pdf`)
                    }
                    className="gap-2"
                  >
                    <PiDownloadSimpleBold className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-slate-400 italic">Not available</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Additional Documents Section - for future uploads */}
      <SectionCard title="Supporting Documents" icon={PiFileTextBold}>
        <div className="text-center py-8 text-slate-500">
          <PiFileTextBold className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm">No additional documents uploaded</p>
          <p className="text-xs text-slate-400 mt-1">
            Supporting documents will appear here when attached to the contract
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
