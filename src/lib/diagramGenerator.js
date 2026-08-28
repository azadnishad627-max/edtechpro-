// Utility to generate high-quality vector SVG diagrams for Reasoning & NMMS MAT questions

export function encodeSvgToDataUri(svgString) {
  const cleanSvg = svgString.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

// 1. 3D Isometric Dice / Cube with numbers on 3 visible faces
export function generateDiceSvg(topNum = 3, leftNum = 1, rightNum = 2, diceLabel = "पासा (Dice)") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="100%" height="100%">
    <defs>
      <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
      <linearGradient id="leftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e2e8f0"/>
        <stop offset="100%" stop-color="#94a3b8"/>
      </linearGradient>
      <linearGradient id="rightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#cbd5e1"/>
        <stop offset="100%" stop-color="#64748b"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>

    <!-- Background card -->
    <rect width="320" height="240" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>

    <!-- Title / Label -->
    <text x="160" y="28" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle" letter-spacing="0.5">
      🎲 ${diceLabel}
    </text>

    <g transform="translate(0, 10)" filter="url(#shadow)">
      <!-- Top Face (Isometric rhombus) -->
      <polygon points="160,50 230,85 160,120 90,85" fill="url(#topGrad)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>
      
      <!-- Left Face -->
      <polygon points="90,85 160,120 160,200 90,165" fill="url(#leftGrad)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>
      
      <!-- Right Face -->
      <polygon points="160,120 230,85 230,165 160,200" fill="url(#rightGrad)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>

      <!-- Top Face Text -->
      <text x="160" y="90" fill="#0f172a" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle" transform="skewX(-25) scale(1, 0.8) translate(38, -35)">
        ${topNum}
      </text>

      <!-- Left Face Text -->
      <text x="125" y="162" fill="#0f172a" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle" transform="skewY(25) scale(0.9, 1) translate(10, -50)">
        ${leftNum}
      </text>

      <!-- Right Face Text -->
      <text x="195" y="162" fill="#0f172a" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle" transform="skewY(-25) scale(0.9, 1) translate(22, 35)">
        ${rightNum}
      </text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 2. Mirror Image Figure Diagram (Object | Mirror line | ?)
export function generateMirrorSvg(originalText = "B 4 7 R") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" width="100%" height="100%">
    <rect width="360" height="180" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    
    <text x="180" y="26" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      🪞 दर्पण प्रतिबिंब (Mirror Image)
    </text>

    <!-- Left Box (Original Object) -->
    <rect x="30" y="45" width="130" height="105" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
    <text x="95" y="108" fill="#f8fafc" font-family="Courier New, monospace, sans-serif" font-size="24" font-weight="900" text-anchor="middle" letter-spacing="4">
      ${originalText}
    </text>
    <text x="95" y="138" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">मूल आकृति (Original)</text>

    <!-- Vertical Mirror Line M-N -->
    <line x1="180" y1="40" x2="180" y2="155" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
    <text x="180" y="38" fill="#ef4444" font-size="11" font-weight="bold" text-anchor="middle">M</text>
    <text x="180" y="170" fill="#ef4444" font-size="11" font-weight="bold" text-anchor="middle">N</text>

    <!-- Right Box (Mirror reflection query) -->
    <rect x="200" y="45" width="130" height="105" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4"/>
    <text x="265" y="110" fill="#ffd700" font-family="system-ui, sans-serif" font-size="34" font-weight="900" text-anchor="middle">
      ?
    </text>
    <text x="265" y="138" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">दर्पण छवि (Reflected)</text>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 3. Water Image Figure Diagram (Object over Water surface)
export function generateWaterSvg(originalText = "T R I A N G L E") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" width="100%" height="100%">
    <rect width="360" height="200" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="180" y="26" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      💧 जल प्रतिबिंब (Water Image)
    </text>

    <!-- Original Box -->
    <rect x="60" y="40" width="240" height="60" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
    <text x="180" y="78" fill="#f8fafc" font-family="Courier New, monospace, sans-serif" font-size="20" font-weight="900" text-anchor="middle" letter-spacing="3">
      ${originalText}
    </text>

    <!-- Water Surface Line -->
    <line x1="30" y1="110" x2="330" y2="110" stroke="#0ea5e9" stroke-width="3" stroke-dasharray="8,4"/>
    <text x="180" y="124" fill="#0ea5e9" font-size="11" font-weight="bold" text-anchor="middle">~~~~~ जल तल (Water Surface) ~~~~~</text>

    <!-- Target Box -->
    <rect x="60" y="132" width="240" height="52" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4"/>
    <text x="180" y="165" fill="#ffd700" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">
      ? (जल में छवि)
    </text>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 4. Venn Diagram (3 Overlapping Circles with categories / numbers)
export function generateVennSvg(labelA = "खिलाड़ी", labelB = "गायक", labelC = "डॉक्टर", nums = [4, 7, 3, 2, 5, 8, 9]) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 250" width="100%" height="100%">
    <rect width="340" height="250" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="170" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      ⭕ वेन आरेख (Venn Diagram)
    </text>

    <!-- Circle A (Top) -->
    <circle cx="170" cy="95" r="55" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="2.5"/>
    <text x="170" y="38" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">${labelA}</text>

    <!-- Circle B (Bottom Left) -->
    <circle cx="130" cy="155" r="55" fill="rgba(244, 63, 94, 0.25)" stroke="#f43f5e" stroke-width="2.5"/>
    <text x="80" y="225" fill="#f43f5e" font-size="12" font-weight="bold" text-anchor="middle">${labelB}</text>

    <!-- Circle C (Bottom Right) -->
    <circle cx="210" cy="155" r="55" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" stroke-width="2.5"/>
    <text x="260" y="225" fill="#f59e0b" font-size="12" font-weight="bold" text-anchor="middle">${labelC}</text>

    <!-- Number labels inside intersections -->
    <text x="170" y="75" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">${nums[0] || '1'}</text>
    <text x="110" y="165" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">${nums[1] || '2'}</text>
    <text x="230" y="165" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">${nums[2] || '3'}</text>
    <text x="145" y="115" fill="#ffd700" font-size="13" font-weight="bold" text-anchor="middle">${nums[3] || '4'}</text>
    <text x="195" y="115" fill="#ffd700" font-size="13" font-weight="bold" text-anchor="middle">${nums[4] || '5'}</text>
    <text x="170" y="180" fill="#ffd700" font-size="13" font-weight="bold" text-anchor="middle">${nums[5] || '6'}</text>
    <text x="170" y="142" fill="#4ade80" font-size="15" font-weight="900" text-anchor="middle">${nums[6] || '7'}</text>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 5. Triangle / Geometry Counting Figure
export function generateTriangleCountingSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="100%" height="100%">
    <rect width="320" height="220" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="160" y="26" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      📐 आकृतियों की गणना (Counting Triangles)
    </text>

    <!-- Main Outer Triangle -->
    <polygon points="160,45 280,185 40,185" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"/>

    <!-- Vertical Lines from Apex to Base -->
    <line x1="160" y1="45" x2="160" y2="185" stroke="#f43f5e" stroke-width="2.5"/>
    <line x1="160" y1="45" x2="100" y2="185" stroke="#f59e0b" stroke-width="2"/>
    <line x1="160" y1="45" x2="220" y2="185" stroke="#f59e0b" stroke-width="2"/>

    <!-- Horizontal Transversal Line -->
    <line x1="85" y1="130" x2="235" y2="130" stroke="#4ade80" stroke-width="2.5"/>

    <!-- Base Question indicator -->
    <text x="160" y="210" fill="#94a3b8" font-size="12" font-weight="bold" text-anchor="middle">
      चित्र में कुल कितने त्रिभुज हैं?
    </text>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 6. Matrix Pattern / Grid Reasoning Diagram (3x3 grid with missing '?')
export function generateMatrixSvg(cells) {
  const grid = cells || [["▲", "■", "●"], ["▲▲", "■■", "●●"], ["▲▲▲", "■■■", "?"]];
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" width="100%" height="100%">
    <rect width="320" height="250" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="160" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      🧩 आकृति आव्यूह (Pattern Matrix)
    </text>

    <g transform="translate(45, 38)">
      <!-- 3x3 Grid Outline -->
      <rect width="230" height="195" rx="10" fill="#1e293b" stroke="#475569" stroke-width="2"/>
      
      <!-- Inner Grid Lines -->
      <line x1="76.6" y1="0" x2="76.6" y2="195" stroke="#475569" stroke-width="1.5"/>
      <line x1="153.3" y1="0" x2="153.3" y2="195" stroke="#475569" stroke-width="1.5"/>
      
      <line x1="0" y1="65" x2="230" y2="65" stroke="#475569" stroke-width="1.5"/>
      <line x1="0" y1="130" x2="230" y2="130" stroke="#475569" stroke-width="1.5"/>

      <!-- Cell Contents -->
      <!-- Row 1 -->
      <text x="38.3" y="42" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[0]?.[0] || '1'}</text>
      <text x="115" y="42" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[0]?.[1] || '2'}</text>
      <text x="191.6" y="42" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[0]?.[2] || '3'}</text>

      <!-- Row 2 -->
      <text x="38.3" y="107" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[1]?.[0] || '4'}</text>
      <text x="115" y="107" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[1]?.[1] || '5'}</text>
      <text x="191.6" y="107" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[1]?.[2] || '6'}</text>

      <!-- Row 3 -->
      <text x="38.3" y="172" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[2]?.[0] || '7'}</text>
      <text x="115" y="172" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${grid[2]?.[1] || '8'}</text>
      <text x="191.6" y="172" fill="#ffd700" font-size="24" font-weight="900" text-anchor="middle">${grid[2]?.[2] || '?'}</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 7. Paper Folding & Cutting Diagram
export function generatePaperFoldSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 180" width="100%" height="100%">
    <rect width="340" height="180" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="170" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      ✂️ कागज़ मोड़ना एवं काटना (Paper Folding)
    </text>

    <!-- Step 1: Full Sheet -->
    <rect x="25" y="45" width="80" height="80" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <line x1="65" y1="45" x2="65" y2="125" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/>
    <text x="65" y="145" fill="#94a3b8" font-size="11" text-anchor="middle">(X) मोड़ 1</text>

    <!-- Step 2: Folded Half -->
    <rect x="140" y="45" width="40" height="80" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <line x1="140" y1="85" x2="180" y2="85" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/>
    <text x="160" y="145" fill="#94a3b8" font-size="11" text-anchor="middle">(Y) मोड़ 2</text>

    <!-- Step 3: Cut punch -->
    <rect x="215" y="85" width="40" height="40" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="235" cy="105" r="5" fill="#ef4444"/>
    <polygon points="215,85 225,85 215,95" fill="#ef4444"/>
    <text x="235" y="145" fill="#94a3b8" font-size="11" text-anchor="middle">(Z) कटाई</text>

    <!-- Result Query Box -->
    <rect x="270" y="45" width="45" height="80" rx="6" fill="#1e293b" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3"/>
    <text x="292.5" y="93" fill="#ffd700" font-size="20" font-weight="900" text-anchor="middle">?</text>
    <text x="292.5" y="145" fill="#ffd700" font-size="11" text-anchor="middle">खोलने पर</text>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 8. Smart Diagram Auto-Attacher for AI-generated Reasoning Questions
export function getSmartDiagramForQuestion(topic = '', questionText = '') {
  const combined = (topic + ' ' + questionText).toLowerCase();

  // 1. Dice / Cube
  if (combined.includes('पासा') || combined.includes('dice') || combined.includes('घन') || combined.includes('cube')) {
    const nums = questionText.match(/\b([1-6])\b/g) || ['3', '1', '2'];
    return generateDiceSvg(nums[0] || '3', nums[1] || '1', nums[2] || '2');
  }

  // 2. Mirror Image
  if (combined.includes('दर्पण') || combined.includes('mirror') || combined.includes('प्रतिबिंब')) {
    const wordMatch = questionText.match(/["']([A-Za-z0-9\s]{2,10})["']/) ||
                      questionText.match(/\b([A-Z0-9]{3,8})\b/);
    const word = wordMatch ? wordMatch[1] : "B 4 7 R";
    return generateMirrorSvg(word);
  }

  // 3. Water Image
  if (combined.includes('जल प्रतिबिंब') || combined.includes('water image')) {
    const wordMatch = questionText.match(/["']([A-Za-z0-9\s]{2,10})["']/) ||
                      questionText.match(/\b([A-Z0-9]{3,8})\b/);
    const word = wordMatch ? wordMatch[1] : "T R I A N G L E";
    return generateWaterSvg(word);
  }

  // 4. Venn Diagram
  if (combined.includes('वेन') || combined.includes('venn') || combined.includes('आरेख')) {
    return generateVennSvg();
  }

  // 5. Counting Triangles / Squares / Figures
  if (combined.includes('गिनती') || combined.includes('गणना') || combined.includes('त्रिभुज') || combined.includes('triangle') || combined.includes('वर्ग') || combined.includes('square')) {
    return generateTriangleCountingSvg();
  }

  // 6. Paper Folding & Cutting
  if (combined.includes('कागज़') || combined.includes('कागज') || combined.includes('paper fold') || combined.includes('folding')) {
    return generatePaperFoldSvg();
  }

  // 7. Pattern / Matrix / Figure Series
  if (combined.includes('आव्यूह') || combined.includes('matrix') || combined.includes('आकृति') || combined.includes('pattern') || combined.includes('missing figure')) {
    return generateMatrixSvg();
  }

  return null;
}
