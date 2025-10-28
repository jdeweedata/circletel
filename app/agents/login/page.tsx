/**
 * Sales Agent Login Page
 *
 * Simple email-based authentication for sales agents
 * For now, uses email lookup from sales_agents table
 * TODO: Implement proper authentication with Supabase Auth
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

function AgentLoginContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement proper authentication
      // For now, just validate that the email exists in sales_agents table
      const response = await fetch('/api/sales-agents');
      const data = await response.json();

      if (data.success) {
        const agent = data.agents.find((a: any) => a.email === email && a.status === 'active');

        if (agent) {
          // TODO: Store agent session properly
          sessionStorage.setItem('agent_id', agent.id);
          sessionStorage.setItem('agent_email', agent.email);
          router.push('/agents/dashboard');
        } else {
          setError('Agent not found or inactive. Please contact your administrator.');
        }
      } else {
        setError('Failed to verify agent. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-darkNeutral via-circleTel-secondaryNeutral to-circleTel-darkNeutral flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-circleTel-orange text-white px-4 py-2 rounded-full text-sm font-semibold">
                SALES AGENT PORTAL
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your sales dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Coming soon - email-only authentication for now
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-circleTel-orange hover:bg-orange-600"
                disabled={isLoading || !email}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/contact" className="text-circleTel-orange hover:underline">
                  Contact Sales
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                For testing: Use any email from the sales_agents table
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">
            Need help?{' '}
            <a href="mailto:support@circletel.co.za" className="text-white hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AgentLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AgentLoginContent />
    </Suspense>
  );
}
