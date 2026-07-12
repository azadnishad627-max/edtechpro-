export default function Footer() {
  return (
    <footer className="footer" style={{ padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
      <div className="container">
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} EdTechPro. All rights reserved.</p>
        <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent)' }}>Developer: Azad Kumar</p>
      </div>
    </footer>
  );
}
