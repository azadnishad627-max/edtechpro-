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
        <Link href="/" className="logo flex align-center" style={{ gap: '0.75rem', textDecoration: 'none' }}>
          <img src="/logo.jpg" alt="RK Education Logo" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', animation: 'logoPulse 3s ease-in-out infinite' }} />
          <span style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.5px', color: 'white' }}>RK Education</span>
        </Link>
        <div className="nav-links">
          {userRole !== 'admin' && <Link href="/student-dashboard">Dashboard</Link>}
          {userRole === 'admin' && <Link href="/admin-dashboard">Admin Panel</Link>}
        </div>
        <div className="nav-actions flex align-center" style={{ gap: '1rem' }}>
          {userRole === null && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link href="/admin-login" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', color: '#ff4444', textDecoration: 'none' }}>Admin</Link>
            </div>
          )}
          {userRole === 'student' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/student-dashboard" className="btn-primary mobile-hide" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Dashboard</Link>
            </div>
          )}
          {userRole === 'admin' && (
            <Link href="/admin-dashboard" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', background: '#ff4444', boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)' }}>Admin Panel</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
