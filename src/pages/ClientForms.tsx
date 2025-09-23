import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, Users, Plus, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormStorage } from '@/components/forms/utils/storage';

export function ClientForms() {
  const drafts = FormStorage.listDrafts();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Client Forms & Surveys</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Collect detailed information from clients through customized forms and audit surveys
          </p>
        </div>

        {/* Available Forms */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Forms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Unjani Contract Audit Form */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Unjani Clinic Audit</CardTitle>
                    <Badge variant="secondary">Contract Assessment</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Comprehensive contract audit and rollout planning form for Unjani clinic network migration
                </CardDescription>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>5 sections • ~15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Contract details & contact info</span>
                  </div>
                </div>
                <Link to="/forms/unjani/contract-audit">
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Audit
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Placeholder for Future Forms */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">New Client Form</CardTitle>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Create custom forms for specific client requirements and surveys
                </CardDescription>
                <Button variant="outline" className="w-full" disabled>
                  Available Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Drafts */}
        {drafts.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Drafts</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client & Form Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Saved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {drafts.map((draft) => (
                      <tr key={draft.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {draft.clientName} - {draft.formType.replace('_', ' ')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {draft.data.clinicName || 'Unnamed form'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${draft.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{draft.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {new Date(draft.lastSaved).toLocaleDateString()} at{' '}
                            {new Date(draft.lastSaved).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/forms/${draft.clientName}/${draft.formType.replace('_', '-')}`}
                            >
                              <Button size="sm" variant="outline">
                                Continue
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Export draft data
                                const csvContent = `Field,Value\n${Object.entries(draft.data)
                                  .map(([key, value]) => `"${key}","${value}"`)
                                  .join('\n')}`;
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${draft.clientName}_${draft.formType}_draft.csv`;
                                a.click();
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Help & Instructions */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use Client Forms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">Creating Forms</h4>
              <ul className="space-y-1">
                <li>• Select the appropriate form type for your client</li>
                <li>• Fill out all required fields marked with *</li>
                <li>• Save drafts to continue later</li>
                <li>• Review and submit when complete</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data Management</h4>
              <ul className="space-y-1">
                <li>• Forms auto-save as you type</li>
                <li>• Export data as CSV or JSON</li>
                <li>• Submitted data integrates with CRM</li>
                <li>• Access historical submissions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}