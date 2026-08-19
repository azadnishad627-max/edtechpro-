'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function PrintPaperPage() {
  const [paperData, setPaperData] = useState(null);
  const [density, setDensity] = useState('normal');
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const paperRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('print_paper_data');
      if (saved) {
        setPaperData(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error reading paper data from localStorage:', e);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setIsDownloading(true);
    setStatusMsg('PDF banayi ja rahi hai...');

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const title = paperData?.title || 'QuestionPaper';
      const coaching = paperData?.coaching || 'RK_Education';
      const cleanFileName = (title + '_' + coaching).replace(/[^a-zA-Z0-9_ऀ-ॿ]/g, '_').substring(0, 30) + '_QuestionPaper.pdf';

      const opt = {
        margin: [8, 10, 8, 10],
        filename: cleanFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(paperRef.current).set(opt).save();
      setStatusMsg('✅ PDF download ho gaya (Downloads folder me check karein)!');
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error('PDF download error:', err);
      setStatusMsg('Print button ka use karke Save as PDF karein.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (!paperData) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Koi Question Paper Data Nahi Mila</h2>
        <p style={{ color: '#a1a1aa', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Pehle Admin Dashboard me jakar MCQ text paste karein aur &quot;Open / Download Paper&quot; dabayein.</p>
        <Link href="/admin-dashboard" style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          ⬅️ Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  const { coaching, subHeader, title, batchName, duration, marks, dateStr, questions } = paperData;

  return (
    <div style={{ background: '#f4f4f5', minHeight: '100vh', color: '#000', fontFamily: "'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif" }}>
      {/* Floating Action Bar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: '#18181b', color: '#fff',
        padding: '0.75rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)', borderBottom: '1px solid #27272a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin-dashboard" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ⬅️ Dashboard
          </Link>
          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#4caf50' }}>📄 A4 Exam Paper</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={() => setDensity(density === 'normal' ? 'compact' : 'normal')}
            style={{ background: '#27272a', color: '#e4e4e7', border: '1px solid #3f3f46', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {density === 'compact' ? '↔️ Spacing: Compact' : '↔️ Spacing: Normal'}
          </button>

          <button 
            type="button" 
            onClick={handleDownloadPdf} 
            disabled={isDownloading}
            style={{ background: '#ff9800', color: '#111', fontWeight: 'bold', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {isDownloading ? '⏳ Saving...' : '⬇️ Download PDF File'}
          </button>

          <button 
            type="button" 
            onClick={handlePrint}
            style={{ background: '#4caf50', color: '#fff', fontWeight: 'bold', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="no-print" style={{ background: '#10b981', color: '#fff', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
          {statusMsg}
        </div>
      )}

      {/* A4 Paper Sheet Wrapper */}
      <div style={{ maxWidth: '850px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div 
          ref={paperRef}
          id="printable-paper"
          style={{
            background: '#fff',
            padding: density === 'compact' ? '20px 24px' : '26px 30px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontSize: density === 'compact' ? '11px' : '12px',
            lineHeight: 1.35
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: density === 'compact' ? '20px' : '23px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#000', marginBottom: '1px', lineHeight: 1.2 }}>
              {coaching}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
              {subHeader}
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, background: '#f0f0f0', display: 'inline-block', padding: '2px 14px', borderRadius: '4px', border: '1px solid #aaa', marginBottom: '5px' }}>
              {title}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', padding: '1px 4px' }}><b>Batch:</b> {batchName}</td>
                  <td style={{ textAlign: 'center', padding: '1px 4px' }}><b>Time:</b> {duration}</td>
                  <td style={{ textAlign: 'right', padding: '1px 4px' }}><b>Max Marks:</b> {marks}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', padding: '1px 4px' }}><b>Date:</b> {dateStr}</td>
                  <td style={{ textAlign: 'center', padding: '1px 4px' }}><b>Total Qs:</b> {questions?.length || 0}</td>
                  <td style={{ textAlign: 'right', padding: '1px 4px' }}><b>Roll No:</b> ____________</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '10.5px', fontStyle: 'italic', borderBottom: '1px dashed #555', paddingBottom: '3px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span><b>निर्देश:</b> सभी प्रश्न अनिवार्य हैं। सही विकल्प का चयन करें।</span>
            <span><b>Negative Marking:</b> No</span>
          </div>

          {/* 2-Column Layout with Vertical Divider Line */}
          <div style={{
            columnCount: 2,
            columnGap: '24px',
            columnRule: '1px solid #222',
            textAlign: 'left',
            width: '100%'
          }}>
            {questions && questions.map((q, idx) => (
              <div 
                key={idx} 
                className="question-block"
                style={{
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                  WebkitColumnBreakInside: 'avoid',
                  marginBottom: density === 'compact' ? '6px' : '9px',
                  paddingBottom: density === 'compact' ? '4px' : '6px',
                  borderBottom: '0.5px dotted #bbb'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: density === 'compact' ? '11px' : '12px', color: '#000', marginBottom: '3px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  Q{idx + 1}. {q.question_text}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 6px', fontSize: density === 'compact' ? '10px' : '11px', paddingLeft: '2px' }}>
                  <div style={{ lineHeight: 1.28, wordBreak: 'break-word' }}><span style={{ fontWeight: 700, marginRight: '3px' }}>(A)</span>{q.option_a || '-'}</div>
                  <div style={{ lineHeight: 1.28, wordBreak: 'break-word' }}><span style={{ fontWeight: 700, marginRight: '3px' }}>(B)</span>{q.option_b || '-'}</div>
                  <div style={{ lineHeight: 1.28, wordBreak: 'break-word' }}><span style={{ fontWeight: 700, marginRight: '3px' }}>(C)</span>{q.option_c || '-'}</div>
                  <div style={{ lineHeight: 1.28, wordBreak: 'break-word' }}><span style={{ fontWeight: 700, marginRight: '3px' }}>(D)</span>{q.option_d || '-'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '9px', color: '#555', borderTop: '1px solid #aaa', paddingTop: '3px' }}>
            *** Best of Luck • {coaching} ***
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body, html {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-paper {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          .question-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
