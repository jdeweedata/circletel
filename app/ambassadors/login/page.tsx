'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AmbassadorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'suspended'
      ? 'Your account has been suspended. Please contact support.'
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Check if user is an ambassador
      const { data: ambassador, error: ambassadorError } = await supabase
        .from('ambassadors')
        .select('id, status')
        .eq('user_id', data.user.id)
        .single();

      if (ambassadorError || !ambassador) {
        await supabase.auth.signOut();
        setError('No ambassador account found. Please register first.');
        setLoading(false);
        return;
      }

      if (ambassador.status === 'suspended') {
        await supabase.auth.signOut();
        setError('Your account has been suspended. Please contact support.');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/ambassadors');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold text-circleTel-orange">
              CircleTel
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ambassador Login</h1>
          <p className="text-gray-500 mt-2">
            Sign in to access your ambassador dashboard
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don&apos;t have an account?</span>{' '}
            <Link
              href="/ambassadors/register"
              className="text-circleTel-orange hover:underline font-medium"
            >
              Apply to become an ambassador
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Not an ambassador?{' '}
          <Link href="/auth/login" className="text-circleTel-orange hover:underline">
            Customer login
          </Link>
        </p>
      </div>
    </div>
  );
}
