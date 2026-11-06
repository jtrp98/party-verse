'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TruthOrDareRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/games/party');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <div className="text-sm font-bold text-amber-400">กำลังเข้าสู่ Party Mode...</div>
        <div className="text-xs text-zinc-500">ระบบเปลี่ยนเส้นทางอัตโนมัติ</div>
      </div>
    </div>
  );
}
