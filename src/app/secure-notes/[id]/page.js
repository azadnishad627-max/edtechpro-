"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SecureNotesViewer() {
  const params = useParams();
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState(0);

  const [material, setMaterial] = useState(null);
  const [student, setStudent] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Zoom and Scaling State
  const [scale, setScale] = useState(1.0);
  const [fitMode, setFitMode] = useState('width'); // 'width' or 'custom'
  const containerRef = useRef(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey)) {
        document.body.style.display = 'none';
        alert("Screenshots and Printing are strictly prohibited!");
        setTimeout(() => { document.body.style.display = 'block'; }, 2000);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

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

  // Zoom Controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
    setFitMode('custom');
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
    setFitMode('custom');
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setFitMode('width');
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Calculate base width based on window and zoom scale
  const baseWidth = windowWidth ? Math.min(windowWidth * 0.95, 900) : 800;
  const renderWidth = fitMode === 'width' ? baseWidth * scale : baseWidth * scale;

  if (loading) {
    return (
      <div style={{ background: '#090e17', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
        <h2 style={{ color: '#38bdf8' }}>Loading Secure PDF Notes...</h2>
        <p style={{ color: '#94a3b8' }}>Please wait while we prepare high-quality reading mode.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#090e17', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2 style={{ color: '#ff4444' }}>{error}</h2>
        <button onClick={() => window.close()} className="btn-primary mt-4">Close Viewer</button>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#090e17', 
      minHeight: '100vh', 
      position: 'relative',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      display: 'flex',
      flexDirection: 'column'
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
          opacity: 0.12,
          color: 'white',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          transform: 'rotate(-35deg)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '60px'
        }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} style={{ whiteSpace: 'nowrap' }}>
              {student.name} | {student.className || student.class_name}
            </span>
          ))}
        </div>
      )}

      {/* Top Sticky Header */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 1.25rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: 'clamp(0.95rem, 3vw, 1.2rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🔒 {material.title.replace(/\[CLASS:[^\]]+\]/gi, '').replace(/\[SUBJECT:[^\]]+\]/gi, '').replace(/\[CHAPTER:[^\]]+\]/gi, '').trim() || material.title}
          </h2>
          {numPages && (
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
              Total Pages: {numPages}
            </span>
          )}
        </div>

        <button 
          onClick={() => window.close()} 
          className="btn-outline" 
          style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          ✕ Close
        </button>
      </div>

      {/* FLOATING ZOOM CONTROLLER TOOLBAR */}
      <div style={{
        position: 'sticky',
        top: '60px',
        zIndex: 999,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '50px',
        padding: '0.4rem 0.8rem',
        margin: '0.5rem auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
        alignSelf: 'center'
      }}>
        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#0ea5e9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          ➖
        </button>

        {/* Current Zoom Percentage */}
        <span style={{ 
          fontSize: '0.85rem', 
          fontWeight: 'bold', 
          color: '#38bdf8', 
          minWidth: '55px', 
          textAlign: 'center',
          userSelect: 'none'
        }}>
          {Math.round(scale * 100)}%
        </span>

        {/* Zoom In Button */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#0ea5e9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          ➕
        </button>

        {/* Fit / Reset Button */}
        <button
          type="button"
          onClick={handleResetZoom}
          title="Fit to Screen (100%)"
          style={{
            background: scale === 1.0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px',
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginLeft: '0.25rem'
          }}
        >
          ↔️ Fit Width
        </button>

        {/* 200% Quick Zoom */}
        <button
          type="button"
          onClick={() => { setScale(2.0); setFitMode('custom'); }}
          title="2x Zoom"
          style={{
            background: scale === 2.0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '0.35rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          2X
        </button>
      </div>

      {/* PDF Scroll & Pan Container */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '1rem 0.5rem 4rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <Document
          file={material.file_url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div style={{ color: '#38bdf8', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
              Loading and Encrypting Document Pages...
            </div>
          }
          error={
            <div style={{ color: '#ff4444', padding: '3rem', textAlign: 'center' }}>
              Failed to load PDF. The document might be corrupted or inaccessible.
            </div>
          }
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div 
              key={`page_${index + 1}`} 
              style={{ 
                marginBottom: '20px', 
                boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff',
                transition: 'width 0.2s ease, transform 0.2s ease'
              }}
            >
              <Page 
                pageNumber={index + 1} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={renderWidth}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
