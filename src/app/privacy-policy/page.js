"use client";
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container py-4" style={{ maxWidth: '850px', minHeight: '80vh', paddingBottom: '5rem' }}>
      <div className="glass-card animate-fade-in" style={{ padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--bg-card-dark)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="text-accent" style={{ fontSize: '2rem', margin: '0 0 0.3rem 0' }}>Privacy Policy</h1>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Last updated: August 2026 • RK Education</p>
          </div>
          <Link href="/" className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            ← Back to Home
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: '#cbd5e1' }}>
          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>1. Introduction</h3>
            <p>
              Welcome to <b>RK Education</b> ("we," "our," or "us"). We are dedicated to providing students with high-quality online mock tests, study materials, and educational preparation (specifically for NMMS, TGT, PGT, and school exams). This Privacy Policy explains how we collect, use, protect, and handle your information when you use our web application and mobile application.
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>2. Information We Collect</h3>
            <p>When you register or use our app, we may collect the following information:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><b>Personal Details:</b> Name, Date of Birth, Class / Standard, and enrolled Batch.</li>
              <li><b>Contact Information:</b> 10-digit WhatsApp / Phone Number (used for account verification and updates).</li>
              <li><b>Account Credentials:</b> Username and encrypted password.</li>
              <li><b>Academic & Performance Data:</b> Online test scores, question attempt history, time taken, bookmarks, and leaderboard rankings.</li>
              <li><b>Profile Picture (Optional):</b> Uploaded solely for displaying your student profile avatar.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>3. How We Use Your Information</h3>
            <p>We use the collected information for the following legitimate educational purposes:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>To provide, personalize, and maintain your student dashboard and enrolled course content.</li>
              <li>To evaluate online mock tests and calculate your rank on the batch leaderboard.</li>
              <li>To authenticate your account securely and prevent unauthorized access.</li>
              <li>To communicate important test announcements, schedules, and administrative support.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>4. Data Security</h3>
            <p>
              We implement industry-standard administrative, technical, and physical security safeguards (including secure HTTPS encryption and encrypted database storage via Supabase) to protect your personal data from unauthorized access, disclosure, alteration, or destruction.
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>5. Third-Party Services</h3>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may integrate secure third-party services such as YouTube (for embedded educational video lectures) and Telegram (for official test notifications and quizzes).
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>6. Children's Privacy</h3>
            <p>
              Our application is designed for school and competitive exam students. We do not collect unnecessary personal data and ensure all content is strictly educational.
            </p>
          </section>

          <section style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>7. User Rights & Account / Data Deletion</h3>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              You have the right to request access to, update, or permanently delete your account and associated academic data at any time.
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              To request account deletion or data removal, you can contact our administrator directly via the in-app support chat, or send an email/message to: <b style={{ color: 'white' }}>the_trader3229@gmail.com</b> or via WhatsApp. Your account and test records will be permanently removed within 48 hours upon verification.
            </p>
          </section>

          <section>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>8. Contact Us</h3>
            <p>
              If you have any questions, suggestions, or concerns regarding this Privacy Policy, please reach out to us at:
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <b>RK Education</b><br />
              Developer: Azad Kumar<br />
              Instagram: <a href="https://www.instagram.com/the_trader3229" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>@the_trader3229</a>
            </p>
          </section>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <Link href="/student-dashboard" className="btn-primary">
            Go to Student Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
