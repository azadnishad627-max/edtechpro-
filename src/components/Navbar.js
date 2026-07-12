"use client";
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar glass-card">
      <div className="container nav-container">
        <Link href="/" className="logo">
          EdTech<span className="text-accent">Pro</span>
        </Link>
        <div className="nav-links">
          <Link href="/batch/1">Batches</Link>
          <Link href="/student-dashboard">Dashboard</Link>
        </div>
        <div className="nav-actions flex align-center" style={{ gap: '1rem' }}>
          <Link href="/admin-login" className="text-muted" style={{ fontSize: '0.875rem' }}>Admin</Link>
          <Link href="/student-setup" className="btn-primary">Register Free</Link>
        </div>
      </div>
    </nav>
  );
}
