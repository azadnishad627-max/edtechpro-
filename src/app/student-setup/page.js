"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function StudentSetup() {
  const [formData, setFormData] = useState({ name: '', dob: '', className: '', username: '', password: '' });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check if username already exists
    const { data: existingUser } = await supabase.from('profiles').select('id').eq('username', formData.username).single();
    if (existingUser) {
      alert("Username already taken. Please choose another one.");
      return;
    }

    const studentId = crypto.randomUUID();

    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: studentId,
        username: formData.username,
        password: formData.password,
        name: formData.name,
        dob: formData.dob,
        class_name: formData.className,
        role: 'student'
      }
    ]);

    if (profileError) {
      alert("Error: " + profileError.message);
      return;
    }

    localStorage.setItem('studentInfo', JSON.stringify({ ...formData, id: studentId }));
    router.push('/student-dashboard');
  };

  return (
    <div className="container py-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="mb-2 text-center">Student Registration</h2>
        <p className="text-muted text-center mb-4">Create your account to start learning.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().trim()})}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
              required
            />
          </div>
          <input 
            type="text" 
            placeholder="Full Name" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
            required
          />
          <input 
            type="date" 
            placeholder="Date of Birth"
            value={formData.dob}
            onChange={(e) => setFormData({...formData, dob: e.target.value})}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
            required
          />
          <input 
            type="text" 
            placeholder="Class / Standard (e.g., 12th Science)"
            value={formData.className}
            onChange={(e) => setFormData({...formData, className: e.target.value})}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
            required
          />
          <div>
            <label className="text-muted mb-2" style={{ display: 'block' }}>Profile Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'white', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn-primary mt-4" style={{ width: '100%' }}>Create Account & Dashboard</button>
        </form>
        <div className="text-center mt-4">
          <p className="text-muted">Already have an account? <a href="/student-login" className="text-accent" style={{ textDecoration: 'none' }}>Log In</a></p>
        </div>
      </div>
    </div>
  );
}
