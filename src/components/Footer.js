"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const adminInfo = localStorage.getItem('adminInfo');
    const studentInfo = localStorage.getItem('studentInfo');
    
    if (adminInfo || studentInfo) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname]);

  if (isLoggedIn) return null;

  return (
    <footer className="footer" style={{ padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
      <div className="container">
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} RK Education. All rights reserved.</p>
        <p style={{ fontWeight: 'bold', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          <span className="text-muted">Developer: </span>
          <a 
            href="https://www.instagram.com/the_trader3229?igsh=dWdoYWtvdXlvMHQx" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#d62976', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s ease' }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Azad Kumar
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </p>
      </div>
    </footer>
  );
}
