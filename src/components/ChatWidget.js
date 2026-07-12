"use client";
import { useState } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Mentor. How can I help you today?' }
  ]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply || "Error connecting to AI." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error connecting to AI." }]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--gradient-brand)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '65px',
          height: '65px',
          fontSize: '1.75rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ✨
      </button>

      {isOpen && (
        <div className="glass-card animate-fade-in" style={{
          position: 'fixed',
          bottom: '6.5rem',
          right: '2rem',
          width: '350px',
          height: '500px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="text-accent" style={{ margin: 0 }}>AI Mentor</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.5rem', padding: '0 0.5rem' }}>×</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-dark)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                maxWidth: '85%',
                fontSize: '0.95rem'
              }}>
                {msg.text}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question..." 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} 
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}
