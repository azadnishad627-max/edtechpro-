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
      // Try decompressing zlib base64url
      const buf = Buffer.from(token, 'base64url');
      const decompressed = zlib.inflateSync(buf).toString('utf8');
      paper = JSON.parse(decompressed);
    } catch (e1) {
      try {
        // Fallback plain base64url
        const plain = Buffer.from(token, 'base64url').toString('utf8');
        paper = JSON.parse(plain);
      } catch (e2) {
        return new NextResponse('<h2>Invalid or corrupted Question Paper link. Please generate a new link from Admin Dashboard.</h2>', {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    const { coaching, subHeader, title, batchName, duration, marks, dateStr, questions } = paper;

    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Question Paper'} - ${coaching || 'RK Education'}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif; color: #000; background: #e4e4e7; line-height: 1.35; font-size: 12px; }
    .toolbar { position: sticky; top: 0; background: #18181b; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-bottom: 1px solid #27272a; flex-wrap: wrap; gap: 8px; }
    .btn { cursor: pointer; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
    .btn-green { background: #4caf50; color: #fff; }
    .btn-orange { background: #ff9800; color: #111; }
    .btn-dark { background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; }
    .paper-sheet { max-width: 820px; margin: 16px auto; background: #fff; padding: 24px 28px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border-radius: 4px; }
    .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; page-break-inside: avoid; }
    .coaching-title { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 1px; line-height: 1.2; color: #000; }
    .coaching-sub { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 4px; }
    .test-title-badge { font-size: 13.5px; font-weight: 700; background: #f0f0f0; display: inline-block; padding: 2px 14px; border-radius: 4px; border: 1px solid #aaa; margin-bottom: 5px; color: #000; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 11px; font-weight: 600; margin-top: 2px; }
    .meta-table td { padding: 1px 4px; }
    .instructions-bar { font-size: 10.5px; font-style: italic; border-bottom: 1px dashed #555; padding-bottom: 3px; margin-bottom: 8px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .columns-wrapper { column-count: 2; column-gap: 24px; column-rule: 1px solid #222; text-align: left; }
    .question-block { break-inside: avoid !important; page-break-inside: avoid !important; -webkit-column-break-inside: avoid !important; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 0.5px dotted #bbb; }
    .q-text { font-weight: 700; font-size: 12px; margin-bottom: 3px; line-height: 1.35; word-break: break-word; color: #000; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 6px; font-size: 11px; padding-left: 2px; }
    .opt-cell { line-height: 1.28; word-break: break-word; }
    .opt-label { font-weight: 700; margin-right: 3px; }
    .footer-bar { margin-top: 10px; text-align: center; font-size: 9px; color: #555; border-top: 1px solid #aaa; padding-top: 3px; page-break-inside: avoid; }
    #download-status { display: none; background: #10b981; color: #fff; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 10px; }
    @media print {
      .toolbar { display: none !important; }
      body { background: #fff !important; margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .paper-sheet { box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
      @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
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

    <div class="columns-wrapper" id="columnsWrapper">
      ${(questions || []).map((q, idx) => `
        <div class="question-block">
          <div class="q-text">Q${idx + 1}. ${q.question_text}</div>
          <div class="options-grid">
            <div class="opt-cell"><span class="opt-label">(A)</span> ${q.option_a || '-'}</div>
            <div class="opt-cell"><span class="opt-label">(B)</span> ${q.option_b || '-'}</div>
            <div class="opt-cell"><span class="opt-label">(C)</span> ${q.option_c || '-'}</div>
            <div class="opt-cell"><span class="opt-label">(D)</span> ${q.option_d || '-'}</div>
          </div>
        </div>
      `).join('')}
    </div>

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
      if (isCompact) {
        sheet.style.fontSize = '10.5px';
        sheet.style.padding = '18px 22px';
        btn.innerText = '↔️ Spacing: Compact';
      } else {
        sheet.style.fontSize = '12px';
        sheet.style.padding = '24px 28px';
        btn.innerText = '↔️ Spacing: Normal';
      }
    }

    async function downloadDirectPdf() {
      const element = document.getElementById('paperSheet');
      const dlBtn = document.getElementById('dlBtn');
      const statusSpan = document.getElementById('download-status');
      
      dlBtn.disabled = true;
      dlBtn.innerText = '⏳ Downloading...';
      statusSpan.style.display = 'inline-block';
      statusSpan.innerText = 'PDF banaya ja raha hai...';

      const fileName = "${(title || 'ExamPaper') + '_' + (coaching || 'RKEducation')}".replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30) + "_QuestionPaper.pdf";

      const opt = {
        margin: [8, 10, 8, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        if (window.html2pdf) {
          await html2pdf().from(element).set(opt).save();
          statusSpan.innerText = '✅ Phone ke Downloads folder me save ho gaya!';
        } else {
          window.print();
        }
      } catch (err) {
        console.error(err);
        window.print();
      } finally {
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
