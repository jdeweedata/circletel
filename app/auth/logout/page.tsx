'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      const supabase = createClient();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear any local storage
      localStorage.clear();

      // Redirect to homepage
      router.push('/');
    }

    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange mx-auto mb-4" />
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  );
}
