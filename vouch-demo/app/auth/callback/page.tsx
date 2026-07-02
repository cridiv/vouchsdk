'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Redirecting...</p>
      </div>
    </div>
  );
}