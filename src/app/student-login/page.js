"use client";
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const ADMIN_WHATSAPP = "919999999999"; // Default placeholder

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const inputUsername = username.toLowerCase().trim();
    const pendingUsername = `[PENDING] ${inputUsername}`;

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .in('username', [inputUsername, pendingUsername])
      .maybeSingle();

    if (error || !user) {
      setErrorMsg("User not found. Please check your username.");
      return;
    }

    if (user.username.startsWith('[PENDING] ')) {
      // Show verification error and open WhatsApp
      const whatsappMsg = `Hello Sir, please activate my EdTech account. My Username is: ${inputUsername}`;
      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(whatsappMsg)}`;
      
      setErrorMsg(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <span>Admin not approve your request</span>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: '#25D366', padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginTop: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Send Verification Code
          </a>
        </div>
      );
      return;
    }

    if (user.password !== password) {
      setErrorMsg("Incorrect password.");
      return;
    }

    // Success! Fetch enrolled batch for student
    let userBatchId = null;
    let userBatchTitle = null;
    try {
      const { data: enrollData } = await supabase.from('enrollments').select('batch_id, batches(title)').eq('student_id', user.id).maybeSingle();
      if (enrollData) {
        userBatchId = enrollData.batch_id;
        userBatchTitle = enrollData.batches?.title;
      }
    } catch (e) {}

    localStorage.setItem('studentInfo', JSON.stringify({
      id: user.id,
      name: user.name,
      dob: user.dob,
      className: user.class_name,
      username: user.username,
      batch_id: userBatchId,
      batch_title: userBatchTitle
    }));
    
    router.push('/student-dashboard');
  };

  return (
    <div className="container py-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="mb-2 text-center">Student Login</h2>
        <p className="text-muted text-center mb-4">Welcome back! Please enter your details.</p>
        
        {errorMsg && <p style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem' }}>{errorMsg}</p>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
            required
          />
          
          <button type="submit" className="btn-primary mt-2" style={{ width: '100%' }}>Login</button>
        </form>
        
        <div className="text-center mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/forgot-password" className="text-accent" style={{ textDecoration: 'none' }}>Forgot Password?</Link>
          <p className="text-muted" style={{ marginTop: '1rem' }}>
            Don't have an account? <Link href="/student-setup" className="text-accent" style={{ textDecoration: 'none' }}>Register Here</Link>
          </p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary-dark)' }}>
            <Link href="/privacy-policy" style={{ color: 'var(--text-secondary-dark)', textDecoration: 'underline', marginRight: '0.8rem' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: 'var(--text-secondary-dark)', textDecoration: 'underline' }}>Terms</Link>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/admin-login" style={{ color: 'var(--bg-card-dark)', fontSize: '0.8rem', textDecoration: 'none' }}>Admin</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
