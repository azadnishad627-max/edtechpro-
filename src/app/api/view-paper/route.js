import { NextResponse } from 'next/server';

const paperCache = globalThis._paperCache || new Map();
globalThis._paperCache = paperCache;

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !paperCache.has(id)) {
      return new NextResponse('<h2>Question Paper not found or link expired. Please generate a new one from the Admin Dashboard.</h2>', {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const paper = paperCache.get(id);
    const { coaching, subHeader, title, batchName, duration, marks, dateStr, questions } = paper;

    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${coaching}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif; color: #000; background: #f4f4f5; line-height: 1.35; font-size: 12px; }
    .toolbar { position: sticky; top: 0; background: #18181b; color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-bottom: 1px solid #27272a; flex-wrap: wrap; gap: 8px; }
    .btn { cursor: pointer; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; text-decoration: none; }
    .btn-green { background: #4caf50; color: #fff; }
    .btn-orange { background: #ff9800; color: #111; }
    .btn-dark { background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; }
    .paper-sheet { max-width: 820px; margin: 16px auto; background: #fff; padding: 26px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; }
    .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; page-break-inside: avoid; }
    .coaching-title { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 1px; line-height: 1.2; }
    .coaching-sub { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 4px; }
    .test-title-badge { font-size: 13.5px; font-weight: 700; background: #f0f0f0; display: inline-block; padding: 2px 14px; border-radius: 4px; border: 1px solid #aaa; margin-bottom: 5px; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 11px; font-weight: 600; margin-top: 2px; }
    .meta-table td { padding: 1px 4px; }
    .instructions-bar { font-size: 10.5px; font-style: italic; border-bottom: 1px dashed #555; padding-bottom: 3px; margin-bottom: 8px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .columns-wrapper { column-count: 2; column-gap: 24px; column-rule: 1px solid #222; text-align: left; }
    .question-block { break-inside: avoid !important; page-break-inside: avoid !important; -webkit-column-break-inside: avoid !important; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 0.5px dotted #bbb; }
    .q-text { font-weight: 700; font-size: 12px; margin-bottom: 3px; line-height: 1.35; word-break: break-word; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 6px; font-size: 11px; padding-left: 2px; }
    .opt-cell { line-height: 1.28; word-break: break-word; }
    .opt-label { font-weight: 700; margin-right: 3px; }
    .footer-bar { margin-top: 10px; text-align: center; font-size: 9px; color: #555; border-top: 1px solid #aaa; padding-top: 3px; page-break-inside: avoid; }
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
    <div style="font-weight: bold; color: #4caf50; font-size: 15px;">📄 RK Education — Exam Paper</div>
    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
      <button onclick="toggleDensity()" class="btn btn-dark" id="densityBtn">↔️ Spacing: Normal</button>
      <button onclick="window.print()" class="btn btn-green">🖨️ Save as PDF / Print</button>
    </div>
  </div>

  <div class="paper-sheet" id="paperSheet">
    <div class="header-box">
      <div class="coaching-title">${coaching}</div>
      <div class="coaching-sub">${subHeader}</div>
      <div class="test-title-badge">${title}</div>
      <table class="meta-table">
        <tr>
          <td style="text-align: left;"><b>Batch:</b> ${batchName}</td>
          <td style="text-align: center;"><b>Time:</b> ${duration}</td>
          <td style="text-align: right;"><b>Max Marks:</b> ${marks}</td>
        </tr>
        <tr>
          <td style="text-align: left;"><b>Date:</b> ${dateStr}</td>
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
      *** Best of Luck • ${coaching} ***
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
        sheet.style.padding = '26px 30px';
        btn.innerText = '↔️ Spacing: Normal';
      }
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    return new NextResponse('Error: ' + err.message, { status: 500 });
  }
}
