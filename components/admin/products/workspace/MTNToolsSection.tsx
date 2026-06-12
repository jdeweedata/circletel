'use client';

import { useState, useEffect } from 'react';
import { UnderlineTabs } from '@/components/admin/shared/UnderlineTabs';
import { MTNHeader } from '@/components/admin/mtn-dealer-products/list/MTNHeader';
import { MTNOverviewTab } from '@/components/admin/mtn-dealer-products/overview/MTNOverviewTab';
import { MTNCommissionTab } from '@/components/admin/mtn-dealer-products/commission/MTNCommissionTab';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * MTN Tools section of the product workspace.
 * Renders Overview and Commission Calculator tabs (the Products tab is superseded by ?source=mtn in the catalogue).
 * Includes the import action for MTN deals from the header.
 */
export function MTNToolsSection() {
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/mtn-dealer-products/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle import
  const handleImport = async () => {
    try {
      setImporting(true);
      setImportResult(null);

      // Fetch the JSON file
      const jsonResponse = await fetch('/api/admin/mtn-dealer-products/import-data');

      if (!jsonResponse.ok) {
        setImportResult({
          error: 'Please upload the JSON file or configure the import endpoint',
        });
        return;
      }

      const jsonData = await jsonResponse.json();

      const importResponse = await fetch('/api/admin/mtn-dealer-products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promos: jsonData.promos,
          source_file: jsonData.metadata?.source || 'Manual Import',
          filters: {
            current_deals_only: true,
          },
        }),
      });

      const importResult = await importResponse.json();
      setImportResult(importResult);

      if (importResult.success) {
        fetchStats();
      }
    } catch (err) {
      setImportResult({ error: 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'commission', label: 'Commission Calculator' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header component with import action */}
      <MTNHeader
        importDialogOpen={importDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        importResult={importResult}
        importing={importing}
        handleImport={handleImport}
        onRefresh={() => { fetchStats(); }}
      />

      {/* Tabs */}
      <UnderlineTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <MTNOverviewTab
            stats={stats}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Commission Calculator Tab */}
        {activeTab === 'commission' && (
          <MTNCommissionTab
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}
