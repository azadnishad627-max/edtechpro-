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

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !user) {
      setErrorMsg("User not found. Please check your username.");
      return;
    }

    if (user.password !== password) {
      setErrorMsg("Incorrect password.");
      return;
    }

    // Success! Save session locally and redirect
    localStorage.setItem('studentInfo', JSON.stringify({
      id: user.id,
      name: user.name,
      dob: user.dob,
      className: user.class_name,
      username: user.username
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
          <div style={{ marginTop: '2rem' }}>
            <Link href="/admin-login" style={{ color: 'var(--bg-card-dark)', fontSize: '0.8rem', textDecoration: 'none' }}>Admin</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
