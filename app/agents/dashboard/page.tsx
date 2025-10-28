/**
 * Sales Agent Dashboard
 *
 * Main dashboard for sales agents to:
 * - View performance metrics
 * - Manage quotes
 * - Access shareable links
 * - Track commissions
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Link2,
  ExternalLink,
  Copy,
  Plus
} from 'lucide-react';
import type { SalesAgent } from '@/lib/sales-agents/types';

function AgentDashboardContent() {
  const router = useRouter();
  const [agent, setAgent] = useState<SalesAgent | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For demo purposes - in production, this would come from auth
  const agentId = 'demo-agent-id'; // TODO: Get from auth context

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      setIsLoading(true);

      // Load agent details
      const agentResponse = await fetch(`/api/sales-agents/${agentId}`);
      const agentData = await agentResponse.json();

      if (agentData.success) {
        setAgent(agentData.agent);
        setMetrics({
          acceptance_rate: agentData.agent.acceptance_rate,
          average_quote_value: agentData.agent.average_quote_value,
          active_quotes_count: agentData.agent.active_quotes_count
        });
      }

      // Load quotes for this agent
      const quotesResponse = await fetch(`/api/quotes?agent_id=${agentId}`);
      const quotesData = await quotesResponse.json();

      if (quotesData.success) {
        setQuotes(quotesData.quotes || []);
      }

    } catch (err) {
      setError('Failed to load agent data');
      console.error('Error loading agent data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/quotes/request?token=${token}`;
    navigator.clipboard.writeText(link);
    // TODO: Show toast notification
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || 'Agent not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/agents/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Agent Portal</h1>
              <p className="text-sm text-gray-600">Welcome back, {agent.full_name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => copyLink(agent.unique_link_token)}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Copy My Link
              </Button>
              <Button onClick={() => router.push('/quotes/request')}>
                <Plus className="h-4 w-4 mr-2" />
                New Quote
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Quotes Created */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.total_quotes_created}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          {/* Quotes Accepted */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{agent.total_quotes_accepted}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.acceptance_rate?.toFixed(1)}% acceptance rate
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{agent.total_revenue_generated.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: R{metrics?.average_quote_value?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          {/* Active Quotes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.active_quotes_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending approval/acceptance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Info */}
        <Card className="mb-8 bg-gradient-to-r from-circleTel-orange to-orange-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Commission Rate</CardTitle>
            <CardDescription className="text-white/80">
              Your current commission structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{agent.commission_rate}%</span>
              <span className="text-white/80">per accepted quote</span>
            </div>
            <p className="mt-4 text-sm text-white/90">
              Estimated commission earned: R{(agent.total_revenue_generated * (agent.commission_rate / 100)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Tabs for Quotes and Links */}
        <Tabs defaultValue="quotes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quotes">My Quotes</TabsTrigger>
            <TabsTrigger value="links">Shareable Links</TabsTrigger>
          </TabsList>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quotes</CardTitle>
                <CardDescription>
                  Quotes you've created and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quotes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No quotes yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first quote to get started
                    </p>
                    <Button onClick={() => router.push('/quotes/request')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quote
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{quote.quote_number}</h4>
                            <p className="text-sm text-gray-600">{quote.company_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            quote.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {quote.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold ml-2">
                              R{quote.total_monthly.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}/mo
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Permanent Link</CardTitle>
                <CardDescription>
                  Share this link with customers to track quotes back to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/quotes/request?token=${agent.unique_link_token}`}
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                  />
                  <Button onClick={() => copyLink(agent.unique_link_token)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/quotes/request?token=${agent.unique_link_token}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temporary Links</CardTitle>
                <CardDescription>
                  Create limited-use links for specific campaigns or customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Coming soon</p>
                  <Button variant="outline" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Temporary Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AgentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AgentDashboardContent />
    </Suspense>
  );
}
