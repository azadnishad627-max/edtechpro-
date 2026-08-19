import { NextResponse } from 'next/server';
import zlib from 'zlib';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('d') || searchParams.get('id');
    
    if (!token) {
      return new NextResponse('<h2>Question Paper Data missing. Please generate from Admin Dashboard.</h2>', {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    let paper = null;
    try {
      const buf = Buffer.from(token, 'base64url');
      const decompressed = zlib.inflateSync(buf).toString('utf8');
      paper = JSON.parse(decompressed);
    } catch (e1) {
      try {
        const plain = Buffer.from(token, 'base64url').toString('utf8');
        paper = JSON.parse(plain);
      } catch (e2) {
        return new NextResponse('<h2>Invalid or corrupted link. Please generate from Admin Dashboard.</h2>', {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    const { coaching, subHeader, title, batchName, duration, marks, dateStr, questions } = paper;
    const qList = questions || [];
    const mid = Math.ceil(qList.length / 2);
    const col1Questions = qList.slice(0, mid);
    const col2Questions = qList.slice(mid);

    const renderQuestionBlock = (q, idx) => `
      <div class="question-block">
        <div class="q-text">Q${idx + 1}. ${q.question_text || ''}</div>
        <table class="opt-table">
          <tr>
            <td class="opt-cell"><span class="opt-label">(A)</span> ${q.option_a || '-'}</td>
            <td class="opt-cell"><span class="opt-label">(B)</span> ${q.option_b || '-'}</td>
          </tr>
          <tr>
            <td class="opt-cell"><span class="opt-label">(C)</span> ${q.option_c || '-'}</td>
            <td class="opt-cell"><span class="opt-label">(D)</span> ${q.option_d || '-'}</td>
          </tr>
        </table>
      </div>
    `;

    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Question Paper'} - ${coaching || 'RK Education'}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    @page { size: A4 portrait; margin: 8mm 8mm 8mm 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif; color: #000; background: #e4e4e7; line-height: 1.35; font-size: 12px; }
    
    .toolbar { position: sticky; top: 0; background: #18181b; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-bottom: 1px solid #27272a; flex-wrap: wrap; gap: 8px; }
    .btn { cursor: pointer; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
    .btn-green { background: #4caf50; color: #fff; }
    .btn-orange { background: #ff9800; color: #111; }
    .btn-dark { background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; }
    
    .paper-sheet { width: 100%; max-width: 820px; margin: 16px auto; background: #fff; padding: 22px 26px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border-radius: 4px; box-sizing: border-box; }
    
    .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
    .coaching-title { font-size: 23px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; line-height: 1.2; color: #000; }
    .coaching-sub { font-size: 11.5px; font-weight: 600; color: #333; margin-bottom: 5px; }
    .test-title-badge { font-size: 14px; font-weight: 800; background: #f0f0f0; display: inline-block; padding: 3px 16px; border-radius: 4px; border: 1.5px solid #333; margin-bottom: 6px; color: #000; }
    
    .meta-table { width: 100%; border-collapse: collapse; font-size: 11px; font-weight: 700; margin-top: 2px; }
    .meta-table td { padding: 2px 4px; color: #000; }
    
    .instructions-bar { font-size: 11px; font-style: italic; border-bottom: 1px dashed #444; padding-bottom: 3px; margin-bottom: 8px; display: flex; justify-content: space-between; font-weight: 600; }
    
    /* 2-Column Table Layout (100% Reliable across all PDF & Canvas renderers) */
    .columns-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 4px; }
    .col-left { width: 50%; vertical-align: top; padding-right: 14px; border-right: 1.5px solid #222; }
    .col-right { width: 50%; vertical-align: top; padding-left: 14px; }
    
    .question-block { margin-bottom: 8px; padding-bottom: 5px; border-bottom: 0.5px dotted #aaa; }
    .q-text { font-weight: 700; font-size: 12px; margin-bottom: 3px; line-height: 1.35; word-break: break-word; color: #000; }
    
    .opt-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 2px; }
    .opt-cell { width: 50%; vertical-align: top; padding: 1px 3px; font-size: 11px; line-height: 1.3; color: #000; word-break: break-word; }
    .opt-label { font-weight: 800; margin-right: 3px; color: #000; }
    
    .footer-bar { margin-top: 12px; text-align: center; font-size: 9.5px; color: #444; border-top: 1px solid #999; padding-top: 4px; font-weight: 600; }
    #download-status { display: none; background: #10b981; color: #fff; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 10px; }
    
    @media print {
      .toolbar { display: none !important; }
      body { background: #fff !important; margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .paper-sheet { box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; width: 100% !important; }
      @page { size: A4 portrait; margin: 8mm 8mm 8mm 8mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="font-weight: bold; color: #4caf50; font-size: 14px; display: flex; align-items: center;">
      📄 ${coaching || 'RK Education'} — Exam Paper
      <span id="download-status"></span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
      <button onclick="toggleDensity()" class="btn btn-dark" id="densityBtn">↔️ Spacing: Normal</button>
      <button onclick="downloadDirectPdf()" class="btn btn-orange" id="dlBtn">⬇️ Download PDF to Phone</button>
      <button onclick="window.print()" class="btn btn-green">🖨️ Print / Save as PDF</button>
    </div>
  </div>

  <div class="paper-sheet" id="paperSheet">
    <div class="header-box">
      <div class="coaching-title">${coaching || 'RK EDUCATION'}</div>
      <div class="coaching-sub">${subHeader || 'Competitive Exam & Coaching Center'}</div>
      <div class="test-title-badge">${title || 'MODEL QUESTION PAPER'}</div>
      <table class="meta-table">
        <tr>
          <td style="text-align: left;"><b>Batch:</b> ${batchName || 'All Batches'}</td>
          <td style="text-align: center;"><b>Time:</b> ${duration || '45 Mins'}</td>
          <td style="text-align: right;"><b>Max Marks:</b> ${marks || (questions ? questions.length + ' Marks' : '20 Marks')}</td>
        </tr>
        <tr>
          <td style="text-align: left;"><b>Date:</b> ${dateStr || ''}</td>
          <td style="text-align: center;"><b>Total Qs:</b> ${questions ? questions.length : 0}</td>
          <td style="text-align: right;"><b>Roll No:</b> ____________</td>
        </tr>
      </table>
    </div>

    <div class="instructions-bar">
      <span><b>निर्देश:</b> सभी प्रश्न अनिवार्य हैं। सही विकल्प का चयन करें।</span>
      <span><b>Negative Marking:</b> No</span>
    </div>

    <table class="columns-table">
      <tr>
        <td class="col-left">
          ${col1Questions.map((q, i) => renderQuestionBlock(q, i)).join('')}
        </td>
        <td class="col-right">
          ${col2Questions.map((q, i) => renderQuestionBlock(q, mid + i)).join('')}
        </td>
      </tr>
    </table>

    <div class="footer-bar">
      *** Best of Luck • ${coaching || 'RK Education'} ***
    </div>
  </div>

  <script>
    let isCompact = false;
    function toggleDensity() {
      isCompact = !isCompact;
      const sheet = document.getElementById('paperSheet');
      const btn = document.getElementById('densityBtn');
      const qTexts = document.querySelectorAll('.q-text');
      const optCells = document.querySelectorAll('.opt-cell');
      const qBlocks = document.querySelectorAll('.question-block');
      
      if (isCompact) {
        sheet.style.padding = '16px 20px';
        qTexts.forEach(el => el.style.fontSize = '10.5px');
        optCells.forEach(el => el.style.fontSize = '10px');
        qBlocks.forEach(el => { el.style.marginBottom = '5px'; el.style.paddingBottom = '3px'; });
        btn.innerText = '↔️ Spacing: Compact';
      } else {
        sheet.style.padding = '22px 26px';
        qTexts.forEach(el => el.style.fontSize = '12px');
        optCells.forEach(el => el.style.fontSize = '11px');
        qBlocks.forEach(el => { el.style.marginBottom = '8px'; el.style.paddingBottom = '5px'; });
        btn.innerText = '↔️ Spacing: Normal';
      }
    }

    async function downloadDirectPdf() {
      const originalSheet = document.getElementById('paperSheet');
      const dlBtn = document.getElementById('dlBtn');
      const statusSpan = document.getElementById('download-status');
      
      dlBtn.disabled = true;
      dlBtn.innerText = '⏳ Downloading...';
      statusSpan.style.display = 'inline-block';
      statusSpan.innerText = 'PDF banaya ja raha hai...';

      const fileName = "${(title || 'ExamPaper') + '_' + (coaching || 'RKEducation')}".replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30) + "_QuestionPaper.pdf";

      // Clone element with explicit fixed A4 desktop width (800px) so canvas capture is 100% crisp & identical to desktop
      const clone = originalSheet.cloneNode(true);
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
        filename: fileName,
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

      try {
        if (window.html2pdf) {
          await html2pdf().from(clone).set(opt).save();
          statusSpan.innerText = '✅ Phone ke Downloads folder me save ho gaya!';
        } else {
          window.print();
        }
      } catch (err) {
        console.error(err);
        window.print();
      } finally {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
        dlBtn.disabled = false;
        dlBtn.innerText = '⬇️ Download PDF to Phone';
        setTimeout(() => { statusSpan.style.display = 'none'; }, 6000);
      }
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err) {
    return new NextResponse('Error: ' + err.message, { status: 500 });
  }
}
