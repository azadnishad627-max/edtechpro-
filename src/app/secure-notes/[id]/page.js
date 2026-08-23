"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
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

  // Gesture, Zoom & Pan State
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs for tracking touch & mouse physics
  const containerRef = useRef(null);
  const touchStartRef = useRef({ dist: 0, scale: 1.0, x: 0, y: 0, posX: 0, posY: 0 });
  const lastTapRef = useRef(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const studentData = localStorage.getItem('studentInfo');
    if (!studentData) {
      router.push('/student-login');
      return;
    }
    setStudent(JSON.parse(studentData));

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

  // --- 📱 MULTI-TOUCH PINCH-TO-ZOOM & FINGER PAN GESTURE ENGINE ---
  const getTouchDistance = (t1, t2) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch Gesture Start
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      touchStartRef.current = {
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        posX: position.x,
        posY: position.y
      };
    } else if (e.touches.length === 1) {
      // Check for Double-Tap Zoom
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double tap toggles between 1.0x and 2.2x
        if (scale > 1.2) {
          setScale(1.0);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.2);
        }
      }
      lastTapRef.current = now;

      // 1-Finger Pan Start
      touchStartRef.current = {
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent full page browser scrolling during pinch
      const newDist = getTouchDistance(e.touches[0], e.touches[1]);
      if (touchStartRef.current.dist > 0) {
        const factor = newDist / touchStartRef.current.dist;
        const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 0.7), 4.0);
        setScale(newScale);

        // Adjust Pan position during pinch
        const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const deltaX = currentMidX - touchStartRef.current.x;
        const deltaY = currentMidY - touchStartRef.current.y;
        setPosition({
          x: touchStartRef.current.posX + deltaX,
          y: touchStartRef.current.posY + deltaY
        });
      }
    } else if (e.touches.length === 1 && scale > 1.0) {
      // 1-Finger Pan when zoomed in
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      setPosition({
        x: touchStartRef.current.posX + deltaX,
        y: touchStartRef.current.posY + deltaY
      });
    }
  };

  const handleTouchEnd = () => {
    // If scaled back to 1x or below, reset position
    if (scale <= 1.0) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Button Zoom Handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 4.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.3, 0.7);
      if (next <= 1.0) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const baseWidth = windowWidth ? Math.min(windowWidth * 0.95, 880) : 800;

  if (loading) {
    return (
      <div style={{ background: '#090e17', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
        <h2 style={{ color: '#38bdf8' }}>Loading Secure PDF Notes...</h2>
        <p style={{ color: '#94a3b8' }}>Preparing interactive gesture mode.</p>
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
    <div 
      style={{ 
        background: '#090e17', 
        minHeight: '100vh', 
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        touchAction: 'none' // Controls handled via custom touch engine
      }}
    >
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

      {/* Top Header */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 1.25rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        gap: '0.5rem',
        flexShrink: 0
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: 'clamp(0.95rem, 3vw, 1.15rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🔒 {material.title.replace(/\[CLASS:[^\]]+\]/gi, '').replace(/\[SUBJECT:[^\]]+\]/gi, '').replace(/\[CHAPTER:[^\]]+\]/gi, '').trim() || material.title}
          </h2>
          {numPages && (
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
              Total: {numPages} Pages • 👆 Pinch to Zoom / Drag
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

      {/* FLOATING CONTROLLER TOOLBAR */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '50px',
        padding: '0.45rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        boxShadow: '0 10px 35px rgba(0,0,0,0.6)'
      }}>
        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ➖
        </button>

        {/* Live Zoom Percentage Display */}
        <span style={{ 
          fontSize: '0.9rem', 
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
          title="Zoom In"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ➕
        </button>

        {/* Fit Width / Reset Position */}
        <button
          type="button"
          onClick={handleResetZoom}
          title="Fit to Screen & Reset"
          style={{
            background: scale === 1.0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ↔️ Reset (100%)
        </button>
      </div>

      {/* INTERACTIVE ZOOM & DRAG CANVAS VIEWPORT */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          flex: 1,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '1.5rem 0.5rem 6rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: scale > 1.0 ? 'grab' : 'default',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'top center',
          transition: isDragging ? 'none' : 'transform 0.12s ease-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Document
            file={material.file_url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div style={{ color: '#38bdf8', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                Loading Document Pages...
              </div>
            }
            error={
              <div style={{ color: '#ff4444', padding: '3rem', textAlign: 'center' }}>
                Failed to load PDF document.
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
                  background: '#ffffff'
                }}
              >
                <Page 
                  pageNumber={index + 1} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={baseWidth}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
