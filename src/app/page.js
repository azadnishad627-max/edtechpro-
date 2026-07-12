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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1 className="text-accent animate-fade-in mb-4">RK Education</h1>
      <div style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
