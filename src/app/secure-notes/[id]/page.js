"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SecureNotesViewer() {
  const params = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [student, setStudent] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Basic Auth Check
    const studentData = localStorage.getItem('studentInfo');
    if (!studentData) {
      router.push('/student-login');
      return;
    }
    setStudent(JSON.parse(studentData));

    // Fetch Material
    async function fetchMaterial() {
      const { data, error } = await supabase
        .from('content_materials')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error || !data) {
        setError("Note not found or access denied.");
      } else {
        setMaterial(data);
      }
      setLoading(false);
    }
    
    if (params.id) {
      fetchMaterial();
    }
  }, [params.id, router]);

  // Anti-Piracy Security Mechanisms
  useEffect(() => {
    // 1. Disable Right Click
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. Blackout Screen on PrintScreen Key (Basic Screenshot Deterrent)
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey)) {
        document.body.style.display = 'none';
        alert("Screenshots and Printing are strictly prohibited!");
        setTimeout(() => { document.body.style.display = 'block'; }, 2000);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 3. Clear Clipboard on Copy
    const handleCopy = (e) => {
      e.preventDefault();
      alert("Copying content is prohibited.");
      if (navigator.clipboard) {
        navigator.clipboard.writeText('');
      }
    };
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  if (loading) return <div className="container py-4 text-center">Loading Secure Notes...</div>;
  if (error) return <div className="container py-4 text-center" style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ 
      background: '#111', 
      minHeight: '100vh', 
      position: 'relative',
      userSelect: 'none', // Disable text selection globally
      WebkitUserSelect: 'none'
    }}>
      {/* Dynamic Watermark Overlay */}
      {student && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden',
          opacity: 0.15, // Very faint but visible in photos
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          transform: 'rotate(-45deg)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '50px'
        }}>
          {/* Repeat the watermark multiple times */}
          {Array.from({ length: 50 }).map((_, i) => (
            <span key={i} style={{ whiteSpace: 'nowrap' }}>
              {student.name} | {student.className}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ 
        background: '#000', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>🔒 {material.title}</h2>
        <button onClick={() => window.close()} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444' }}>
          Close Secure Viewer
        </button>
      </div>

      {/* PDF Renderer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
        <Document
          file={material.file_url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div style={{ color: 'white' }}>Encrypting and Loading Document...</div>}
          error={<div style={{ color: 'red' }}>Failed to load PDF. It might be corrupted or inaccessible.</div>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} style={{ marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              <Page 
                pageNumber={index + 1} 
                renderTextLayer={false} // Disable text layer entirely to prevent DOM scraping
                renderAnnotationLayer={false}
                scale={1.2}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
