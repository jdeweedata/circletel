import { Metadata } from 'next';
import { ContractTerritoryMap } from '@/components/admin/marketing/ContractTerritoryMap';

export const metadata: Metadata = {
  title: 'Contract Territory Map | Marketing | CircleTel Admin',
  description: 'Competitor customer locations — assess DFA coverage before targeting',
};

export default function ContractTerritoryMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Contract Territory Map</h1>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
            833 addresses
          </span>
        </div>
        <p className="text-gray-500 mt-1 text-sm">
          Competitor customer locations — assess coverage before targeting
        </p>
      </div>
      <ContractTerritoryMap />
    </div>
  );
}
