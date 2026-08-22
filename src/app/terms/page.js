"use client";
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="container py-4" style={{ maxWidth: '850px', minHeight: '80vh', paddingBottom: '5rem' }}>
      <div className="glass-card animate-fade-in" style={{ padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--bg-card-dark)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="text-accent" style={{ fontSize: '2rem', margin: '0 0 0.3rem 0' }}>Terms of Service</h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Last updated: August 2026 • RK Education</p>
          </div>
          <Link href="/" className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            ← Back to Home
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: '#cbd5e1' }}>
          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h3>
            <p>
              By accessing or using the <b>RK Education</b> website, mobile web app, or native Android application, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>2. Account Responsibilities</h3>
            <p>
              You are responsible for maintaining the confidentiality of your username and password. You agree not to share your login credentials with unauthorized individuals or attempt to disrupt the platform.
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>3. Academic Integrity & Fair Testing</h3>
            <p>
              All online tests and quizzes are designed for educational self-assessment. Users agree to take tests honestly without using automated scripts, cheating tools, or malicious interference with the leaderboard scoring system.
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>4. Intellectual Property</h3>
            <p>
              All study notes, question banks, video lectures, and platform design are the intellectual property of RK Education and protected under copyright laws. Unauthorized reproduction or commercial distribution is prohibited.
            </p>
          </section>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <Link href="/" className="btn-primary">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
