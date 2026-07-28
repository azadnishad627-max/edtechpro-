"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function StudentSetup() {
  const [formData, setFormData] = useState({ name: '', dob: '', className: '', username: '', password: '', whatsapp: '' });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const router = useRouter();

  const ADMIN_WHATSAPP = "919795206548"; // Admin's actual WhatsApp number

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Check if whatsapp_number already exists to prevent duplicate IDs
    const { data: existingPhone } = await supabase.from('profiles').select('id').eq('whatsapp_number', formData.whatsapp).maybeSingle();
    if (existingPhone) {
      alert("This WhatsApp number is already registered! Only 1 ID is allowed per number.");
      setIsSubmitting(false);
      return;
    }

    // Check if username already exists (either normal or pending)
    const { data: existingUser } = await supabase.from('profiles').select('id').in('username', [formData.username, `[PENDING] ${formData.username}`]).maybeSingle();
    if (existingUser) {
      alert("Username already taken. Please choose another one.");
      setIsSubmitting(false);
      return;
    }

    let finalPhotoUrl = null;

    if (profilePhoto) {
      const fileExt = profilePhoto.name.split('.').pop();
      const fileName = `profile_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(fileName, profilePhoto);

      if (uploadError) {
        alert("Error uploading photo: " + uploadError.message);
        setIsSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(fileName);
      finalPhotoUrl = publicUrlData.publicUrl;
    }

    const studentId = crypto.randomUUID();
    const pendingUsername = `[PENDING] ${formData.username}`;

    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: studentId,
        username: pendingUsername,
        password: formData.password,
        name: formData.name,
        dob: formData.dob,
        class_name: formData.className,
        role: 'student',
        photo_url: finalPhotoUrl,
        whatsapp_number: formData.whatsapp
      }
    ]);

    if (profileError) {
      alert("Error: " + profileError.message);
      setIsSubmitting(false);
      return;
    }

    // Do NOT set localStorage or redirect yet. Show verification screen.
    setIsSubmitting(false);
    setIsVerificationStep(true);
  };

  if (isVerificationStep) {
    const whatsappMsg = `Hello Sir, my name is ${formData.name}. Please approve my request. Username: ${formData.username}`;
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(whatsappMsg)}`;

    return (
      <div className="container py-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div className="glass-card animate-fade-in text-center" style={{ width: '100%', maxWidth: '500px' }}>
          <h2 className="mb-4" style={{ color: '#4CAF50' }}>Account Created! 🎉</h2>
          <p className="text-light mb-4">Your account has been created successfully, but it needs to be activated by the Admin.</p>
          <div style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <h4 className="mb-2">Activation Step</h4>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Click the button below to send a verification message to the Admin on WhatsApp. Once approved, you can log in!
            </p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: '#25D366', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Verify via WhatsApp
            </a>
          </div>
          <button onClick={() => router.push('/student-login')} className="btn-outline" style={{ width: '100%' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
            type="tel" 
            placeholder="WhatsApp Number (10 Digits)"
            pattern="[0-9]{10}"
            value={formData.whatsapp}
            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
            required
            title="Please enter a valid 10-digit WhatsApp number"
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
              onChange={(e) => setProfilePhoto(e.target.files[0])}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'white', width: '100%' }}
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary mt-4" style={{ width: '100%' }}>
            {isSubmitting ? 'Creating Account...' : 'Create Account & Dashboard'}
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-muted">Already have an account? <a href="/student-login" className="text-accent" style={{ textDecoration: 'none' }}>Log In</a></p>
        </div>
      </div>
    </div>
  );
}
