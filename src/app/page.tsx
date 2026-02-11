'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';

// ============================================
// HOME PAGE - Redirect to /landing
// ============================================

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.LANDING);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-zinc-500">Carregando...</div>
    </main>
  );
}
