'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Admin Root Page - Redirect to Login
 * 
 * This page enforces that all admin access requires re-authentication
 * even if the user is already logged in elsewhere.
 */
export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any existing admin session and redirect to login
    const forceReauth = async () => {
      try {
        // Add timeout to prevent hanging on slow Supabase Auth
        const SIGNOUT_TIMEOUT = 3000; // 3 seconds
        
        const signoutPromise = (async () => {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          await supabase.auth.signOut();
        })();
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Signout timeout')), SIGNOUT_TIMEOUT);
        });
        
        // Race between signout and timeout
        await Promise.race([signoutPromise, timeoutPromise]);

        // Add a small delay to ensure signout completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect to admin login with signout flag
        router.replace('/admin/login?signout=true');
      } catch (error) {
        console.error('Error during forced re-auth (continuing anyway):', error);
        // Still redirect to login even if signout fails or times out
        // This ensures users aren't stuck on infinite loading
        router.replace('/admin/login?signout=true');
      }
    };

    forceReauth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}

/**
 * ARCHIVED: Previous Dashboard Implementation
 * 
 * The dashboard code has been moved to /admin/dashboard/page.tsx
 * This root page now enforces re-authentication for security.
 * 
 * All dashboard functionality is available at /admin/dashboard
 */
