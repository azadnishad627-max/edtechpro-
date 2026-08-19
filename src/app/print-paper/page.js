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

      const clone = paperRef.current.cloneNode(true);
      clone.style.width = '794px';
      clone.style.maxWidth = '794px';
      clone.style.margin = '0';
      clone.style.background = '#ffffff';
      clone.style.boxShadow = 'none';
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '-9999px';
      clone.style.zIndex = '-1000';
      document.body.appendChild(clone);

      const opt = {
        margin: [6, 8, 6, 8],
        filename: cleanFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(clone).set(opt).save();
      if (document.body.contains(clone)) document.body.removeChild(clone);
      setStatusMsg('✅ PDF download ho gaya (Phone ke Downloads folder me save hai)!');
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
        <p style={{ color: '#a1a1aa', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Pehle Admin Dashboard me jakar MCQ text paste karein aur &quot;Chrome me Open / Download Paper&quot; dabayein.</p>
        <Link href="/admin-dashboard" style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          ⬅️ Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  const { coaching, subHeader, title, batchName, duration, marks, dateStr, questions } = paperData;
  const qList = questions || [];
  const mid = Math.ceil(qList.length / 2);
  const col1Questions = qList.slice(0, mid);
  const col2Questions = qList.slice(mid);

  return (
    <div style={{ background: '#e4e4e7', minHeight: '100vh', color: '#000', fontFamily: "'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif" }}>
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
            {isDownloading ? '⏳ Saving...' : '⬇️ Download PDF to Phone'}
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
      <div style={{ maxWidth: '850px', margin: '1.2rem auto', padding: '0 0.75rem' }}>
        <div 
          ref={paperRef}
          id="printable-paper"
          style={{
            background: '#fff',
            padding: density === 'compact' ? '18px 22px' : '24px 28px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            fontSize: density === 'compact' ? '11px' : '12px',
            lineHeight: 1.35
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: density === 'compact' ? '21px' : '23px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#000', marginBottom: '2px', lineHeight: 1.2 }}>
              {coaching}
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#333', marginBottom: '5px' }}>
              {subHeader}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, background: '#f0f0f0', display: 'inline-block', padding: '3px 16px', borderRadius: '4px', border: '1.5px solid #333', marginBottom: '6px', color: '#000' }}>
              {title}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', padding: '2px 4px', color: '#000' }}><b>Batch:</b> {batchName}</td>
                  <td style={{ textAlign: 'center', padding: '2px 4px', color: '#000' }}><b>Time:</b> {duration}</td>
                  <td style={{ textAlign: 'right', padding: '2px 4px', color: '#000' }}><b>Max Marks:</b> {marks}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', padding: '2px 4px', color: '#000' }}><b>Date:</b> {dateStr}</td>
                  <td style={{ textAlign: 'center', padding: '2px 4px', color: '#000' }}><b>Total Qs:</b> {questions?.length || 0}</td>
                  <td style={{ textAlign: 'right', padding: '2px 4px', color: '#000' }}><b>Roll No:</b> ____________</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '11px', fontStyle: 'italic', borderBottom: '1px dashed #444', paddingBottom: '3px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span><b>निर्देश:</b> सभी प्रश्न अनिवार्य हैं। सही विकल्प का चयन करें।</span>
            <span><b>Negative Marking:</b> No</span>
          </div>

          {/* 2-Column Table (100% Guaranteed PDF output matching Preview) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '4px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '14px', borderRight: '1.5px solid #222' }}>
                  {col1Questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: density === 'compact' ? '5px' : '8px', paddingBottom: density === 'compact' ? '3px' : '5px', borderBottom: '0.5px dotted #aaa' }}>
                      <div style={{ fontWeight: 700, fontSize: density === 'compact' ? '11px' : '12px', color: '#000', marginBottom: '3px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        Q{i + 1}. {q.question_text}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '2px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(A)</span>{q.option_a || '-'}</td>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(B)</span>{q.option_b || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(C)</span>{q.option_c || '-'}</td>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(D)</span>{q.option_d || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </td>
                <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '14px' }}>
                  {col2Questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: density === 'compact' ? '5px' : '8px', paddingBottom: density === 'compact' ? '3px' : '5px', borderBottom: '0.5px dotted #aaa' }}>
                      <div style={{ fontWeight: 700, fontSize: density === 'compact' ? '11px' : '12px', color: '#000', marginBottom: '3px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        Q{mid + i + 1}. {q.question_text}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '2px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(A)</span>{q.option_a || '-'}</td>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(B)</span>{q.option_b || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(C)</span>{q.option_c || '-'}</td>
                            <td style={{ width: '50%', verticalAlign: 'top', padding: '1px 3px', fontSize: density === 'compact' ? '10px' : '11px', color: '#000', wordBreak: 'break-word' }}><span style={{ fontWeight: 800, marginRight: '3px' }}>(D)</span>{q.option_d || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9.5px', color: '#444', borderTop: '1px solid #999', paddingTop: '4px', fontWeight: 600 }}>
            *** Best of Luck • {coaching} ***
          </div>
        </div>
      </div>

      <style jsx global>{\`
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
            max-width: 100% !important;
            width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
        }
      \`}</style>
    </div>
  );
}
