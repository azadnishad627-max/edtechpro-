"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const studentInfo = localStorage.getItem('studentInfo');
    const adminInfo = localStorage.getItem('adminInfo');

    if (adminInfo) {
      router.push('/admin-dashboard');
    } else if (studentInfo) {
      router.push('/student-dashboard');
    } else {
      router.push('/student-login');
    }
  }, [router]);

  return (
    <main className="container hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.jpg" alt="RK Education Logo" style={{ width: '150px', height: '150px', borderRadius: '30px', objectFit: 'cover', animation: 'logoPulse 3s ease-in-out infinite' }} />
        </div>
      <div style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
