"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Verify, 2: Reset
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Check if user exists with matching DOB
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, dob')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !user) {
      setErrorMsg("User not found. Please check the username.");
      return;
    }

    if (user.dob !== dob) {
      setErrorMsg("Verification failed. The Date of Birth does not match our records.");
      return;
    }

    // Success! Move to step 2
    setUserId(user.id);
    setStep(2);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ password: newPassword })
      .eq('id', userId);

    if (error) {
      setErrorMsg("Failed to reset password: " + error.message);
    } else {
      setSuccessMsg("Password successfully reset! Redirecting to login...");
      setTimeout(() => router.push('/student-login'), 2500);
    }
  };

  return (
    <div className="container py-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="mb-2 text-center">Reset Password</h2>
        
        {step === 1 ? (
          <>
            <p className="text-muted text-center mb-4">Enter your username and date of birth for verification.</p>
            {errorMsg && <p style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem' }}>{errorMsg}</p>}

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
                required
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="text-muted" style={{ fontSize: '0.85rem' }}>Date of Birth (Security Check)</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
                  required
                />
              </div>
              <button type="submit" className="btn-primary mt-2" style={{ width: '100%' }}>Verify Identity</button>
            </form>
          </>
        ) : (
          <div className="animate-fade-in">
            <p className="text-accent text-center mb-4">Identity Verified!</p>
            {errorMsg && <p style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem' }}>{errorMsg}</p>}
            {successMsg && <p style={{ color: '#00e5ff', textAlign: 'center', marginBottom: '1rem' }}>{successMsg}</p>}

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password" 
                placeholder="Enter New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
                required
              />
              <button type="submit" className="btn-primary mt-2" style={{ width: '100%', background: 'var(--gradient-brand)' }}>Confirm New Password</button>
            </form>
          </div>
        )}

        <div className="text-center mt-4">
          <Link href="/student-login" className="text-muted" style={{ textDecoration: 'none' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
