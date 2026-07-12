"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [userRole, setUserRole] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for session info
    const adminInfo = localStorage.getItem('adminInfo');
    const studentInfo = localStorage.getItem('studentInfo');
    
    if (adminInfo) {
      setUserRole('admin');
    } else if (studentInfo) {
      setUserRole('student');
    } else {
      setUserRole(null);
    }
  }, [pathname]);

  return (
    <nav className="navbar glass-card">
      <div className="container nav-container">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <img src="/logo.jpg" alt="EdTechPro Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
          <span style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.5px' }}>EdTechPro</span>
        </Link>
        <div className="nav-links">
          {userRole !== 'admin' && <Link href="/student-dashboard">Dashboard</Link>}
          {userRole === 'admin' && <Link href="/admin-dashboard">Admin Panel</Link>}
        </div>
        <div className="nav-actions flex align-center" style={{ gap: '1rem' }}>
          {userRole === null && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link href="/admin-login" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '50px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', color: '#ff4444', textDecoration: 'none' }}>Admin</Link>
            </div>
          )}
          {userRole === 'student' && (
            <Link href="/student-dashboard" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', borderRadius: '50px', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>Dashboard</Link>
          )}
          {userRole === 'admin' && (
            <Link href="/admin-dashboard" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', borderRadius: '50px', background: '#ff4444', boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)' }}>Admin Panel</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
