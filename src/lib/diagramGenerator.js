// Authentic NMMS MAT (Mental Ability Test) Question Booklet Vector SVG Diagram Generator

export function encodeSvgToDataUri(svgString) {
  const cleanSvg = svgString.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

// 1. प्रश्न आकृतियाँ एवं उत्तर आकृतियाँ (Figure Series / Sequence - as in NMMS MAT Q4-6)
export function generateFigureSeriesSvg(title = "आकृति श्रृंखला (Figure Series)") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 250" width="100%" height="100%">
    <rect width="540" height="250" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Header -->
    <text x="270" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      ✨ ${title}
    </text>

    <!-- Section 1: प्रश्न आकृतियाँ (Question Figures) -->
    <text x="30" y="46" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">प्रश्न आकृतियाँ :</text>
    <g transform="translate(25, 54)">
      <!-- Box 1 (Triangle with 3 dots) -->
      <rect x="0" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <polygon points="35,12 60,58 10,58" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="35" cy="30" r="3" fill="#38bdf8"/>
      <circle cx="28" cy="48" r="3" fill="#38bdf8"/>
      <circle cx="42" cy="48" r="3" fill="#38bdf8"/>

      <!-- Box 2 (Square with 4 dots) -->
      <rect x="80" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <rect x="95" y="15" width="40" height="40" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="105" cy="25" r="3" fill="#38bdf8"/>
      <circle cx="125" cy="25" r="3" fill="#38bdf8"/>
      <circle cx="105" cy="45" r="3" fill="#38bdf8"/>
      <circle cx="125" cy="45" r="3" fill="#38bdf8"/>

      <!-- Box 3 (Pentagon with 5 dots) -->
      <rect x="160" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <polygon points="195,12 222,30 212,58 178,58 168,30" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="195" cy="25" r="2.5" fill="#38bdf8"/>
      <circle cx="182" cy="38" r="2.5" fill="#38bdf8"/>
      <circle cx="208" cy="38" r="2.5" fill="#38bdf8"/>
      <circle cx="185" cy="50" r="2.5" fill="#38bdf8"/>
      <circle cx="205" cy="50" r="2.5" fill="#38bdf8"/>

      <!-- Box 4 (Hexagon with 6 dots) -->
      <rect x="240" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <polygon points="260,14 290,14 302,35 290,56 260,56 248,35" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="265" cy="26" r="2" fill="#38bdf8"/><circle cx="285" cy="26" r="2" fill="#38bdf8"/>
      <circle cx="265" cy="36" r="2" fill="#38bdf8"/><circle cx="285" cy="36" r="2" fill="#38bdf8"/>
      <circle cx="265" cy="46" r="2" fill="#38bdf8"/><circle cx="285" cy="46" r="2" fill="#38bdf8"/>

      <!-- Box 5 (?) -->
      <rect x="320" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#ffd700" stroke-width="2" stroke-dasharray="4"/>
      <text x="355" y="44" fill="#ffd700" font-family="system-ui, sans-serif" font-size="28" font-weight="900" text-anchor="middle">?</text>
    </g>

    <!-- Section 2: उत्तर आकृतियाँ (Answer Figures) -->
    <text x="30" y="146" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">उत्तर आकृतियाँ :</text>
    <g transform="translate(60, 154)">
      <!-- Opt 1 -->
      <rect x="0" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <polygon points="20,10 40,10 50,30 40,50 20,50 10,30" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="30" y="76" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(1)</text>

      <!-- Opt 2 -->
      <rect x="90" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#4ade80" stroke-width="2"/>
      <polygon points="20,8 40,8 52,22 47,46 30,54 13,46 8,22" fill="none" stroke="#4ade80" stroke-width="1.5"/>
      <text x="120" y="76" fill="#4ade80" font-size="11" font-weight="bold" text-anchor="middle">(2)</text>

      <!-- Opt 3 -->
      <rect x="180" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <polygon points="210,10 230,25 222,48 198,48 190,25" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="210" y="76" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(3)</text>

      <!-- Opt 4 -->
      <rect x="270" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <polygon points="285,8 315,8 325,25 325,40 315,52 285,52 275,40 275,25" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="300" y="76" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(4)</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 2. आकृति सादृश्यता (Figure Analogy: A : B :: C : ? - as in NMMS MAT Q26-28)
export function generateFigureAnalogySvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 230" width="100%" height="100%">
    <rect width="540" height="230" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="270" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      🔄 आकृति सादृश्यता (Figure Analogy)
    </text>

    <!-- Question Figures -->
    <text x="30" y="46" fill="#94a3b8" font-size="11" font-weight="600">प्रश्न आकृतियाँ :</text>
    <g transform="translate(30, 54)">
      <!-- Fig 1 -->
      <rect x="0" y="0" width="65" height="65" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <path d="M 20,20 Q 45,30 25,50" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
      <polygon points="25,50 20,42 30,44" fill="#38bdf8"/>

      <!-- Ratio 1 ':' -->
      <text x="80" y="38" fill="#f8fafc" font-size="22" font-weight="900" text-anchor="middle">:</text>

      <!-- Fig 2 -->
      <rect x="95" y="0" width="65" height="65" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <path d="M 45,20 Q 20,30 40,50" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
      <polygon points="40,50 45,42 35,44" fill="#38bdf8"/>

      <!-- Proportion '::' -->
      <text x="180" y="38" fill="#ffd700" font-size="22" font-weight="900" text-anchor="middle">::</text>

      <!-- Fig 3 -->
      <rect x="200" y="0" width="65" height="65" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <line x1="20" y1="50" x2="48" y2="20" stroke="#38bdf8" stroke-width="2.5"/>
      <line x1="30" y1="35" x2="20" y2="40" stroke="#38bdf8" stroke-width="2"/>
      <line x1="42" y1="26" x2="48" y2="15" stroke="#38bdf8" stroke-width="2"/>

      <!-- Ratio 2 ':' -->
      <text x="280" y="38" fill="#f8fafc" font-size="22" font-weight="900" text-anchor="middle">:</text>

      <!-- Fig 4 '?' -->
      <rect x="295" y="0" width="65" height="65" rx="6" fill="#1e293b" stroke="#ffd700" stroke-width="2" stroke-dasharray="4"/>
      <text x="327.5" y="42" fill="#ffd700" font-size="26" font-weight="900" text-anchor="middle">?</text>
    </g>

    <!-- Answer Figures -->
    <text x="30" y="142" fill="#94a3b8" font-size="11" font-weight="600">उत्तर आकृतियाँ :</text>
    <g transform="translate(60, 148)">
      <rect x="0" y="0" width="55" height="55" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="27.5" y="70" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(1)</text>

      <rect x="90" y="0" width="55" height="55" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="117.5" y="70" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(2)</text>

      <rect x="180" y="0" width="55" height="55" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="207.5" y="70" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(3)</text>

      <rect x="270" y="0" width="55" height="55" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="297.5" y="70" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(4)</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 3. वेन आरेख ज्यामितीय आकृतियों में (Rectangle, Triangle, Circle - as in NMMS MAT Q54-56)
export function generateGeometryVennSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 250" width="100%" height="100%">
    <rect width="460" height="250" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="230" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      📊 ज्यामितीय वेन आरेख (Geometrical Venn Diagram)
    </text>

    <!-- Legend -->
    <g transform="translate(30, 36)">
      <rect x="0" y="0" width="12" height="12" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <text x="18" y="10" fill="#94a3b8" font-size="11">आयत = अंग्रेजी (English)</text>

      <polygon points="175,12 182,0 189,12" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <text x="195" y="10" fill="#94a3b8" font-size="11">त्रिभुज = जापानी (Japanese)</text>

      <circle cx="345" cy="6" r="6" fill="none" stroke="#f59e0b" stroke-width="2"/>
      <text x="357" y="10" fill="#94a3b8" font-size="11">वृत्त = संस्कृत (Sanskrit)</text>
    </g>

    <!-- Geometry Intersections -->
    <g transform="translate(60, 65)">
      <!-- Rectangle (English) -->
      <rect x="20" y="30" width="220" height="90" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2.5"/>

      <!-- Triangle (Japanese) -->
      <polygon points="45,10 270,120 45,120" fill="rgba(244, 63, 94, 0.12)" stroke="#f43f5e" stroke-width="2.5"/>

      <!-- Circle (Sanskrit) -->
      <circle cx="45" cy="115" r="45" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="2.5"/>

      <!-- Numbers in sections (exact as NMMS MAT paper) -->
      <text x="58" y="28" fill="#f8fafc" font-size="14" font-weight="900">30</text>
      <text x="215" y="45" fill="#f8fafc" font-size="14" font-weight="900">17</text>
      <text x="215" y="112" fill="#f8fafc" font-size="14" font-weight="900">32</text>
      <text x="32" y="95" fill="#f8fafc" font-size="14" font-weight="900">29</text>
      <text x="56" y="95" fill="#ffd700" font-size="14" font-weight="900">25</text>
      <text x="25" y="142" fill="#f8fafc" font-size="14" font-weight="900">64</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 4. लुप्त संख्या ज्ञात करना (Missing Number in Shapes - as in NMMS MAT Q72-73)
export function generateMissingNumberShapesSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 210" width="100%" height="100%">
    <rect width="500" height="210" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="250" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      🔢 लुप्त संख्या ज्ञात करना (Missing Number in Pattern)
    </text>

    <g transform="translate(40, 45)">
      <!-- Circle Set 1 -->
      <g transform="translate(0, 0)">
        <circle cx="60" cy="60" r="30" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <text x="60" y="66" fill="#ffd700" font-size="18" font-weight="bold" text-anchor="middle">162</text>
        <!-- Peripherals -->
        <text x="25" y="20" fill="#f8fafc" font-size="14" font-weight="bold">12</text>
        <text x="90" y="20" fill="#f8fafc" font-size="14" font-weight="bold">28</text>
        <text x="55" y="115" fill="#f8fafc" font-size="14" font-weight="bold">14</text>
      </g>

      <!-- Circle Set 2 -->
      <g transform="translate(150, 0)">
        <circle cx="60" cy="60" r="30" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <text x="60" y="66" fill="#ffd700" font-size="18" font-weight="bold" text-anchor="middle">204</text>
        <text x="25" y="20" fill="#f8fafc" font-size="14" font-weight="bold">21</text>
        <text x="90" y="20" fill="#f8fafc" font-size="14" font-weight="bold">36</text>
        <text x="55" y="115" fill="#f8fafc" font-size="14" font-weight="bold">11</text>
      </g>

      <!-- Circle Set 3 (Target '?') -->
      <g transform="translate(300, 0)">
        <circle cx="60" cy="60" r="30" fill="#1e293b" stroke="#ffd700" stroke-width="2.5" stroke-dasharray="4"/>
        <text x="60" y="68" fill="#ffd700" font-size="24" font-weight="900" text-anchor="middle">?</text>
        <text x="25" y="20" fill="#f8fafc" font-size="14" font-weight="bold">34</text>
        <text x="90" y="20" fill="#f8fafc" font-size="14" font-weight="bold">20</text>
        <text x="55" y="115" fill="#f8fafc" font-size="14" font-weight="bold">12</text>
      </g>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 5. अपूर्ण आकृति पूर्ण करना (Pattern Completion - as in NMMS MAT Q85)
export function generatePatternCompletionSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="100%" height="100%">
    <rect width="520" height="220" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="260" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      🧩 अपूर्ण आकृति पूर्ण करना (Pattern Completion)
    </text>

    <!-- Main Question Box (2x2 Matrix) -->
    <text x="40" y="48" fill="#94a3b8" font-size="11" font-weight="600">प्रश्न आकृति :</text>
    <g transform="translate(35, 56)">
      <rect x="0" y="0" width="100" height="100" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <line x1="50" y1="0" x2="50" y2="100" stroke="#475569" stroke-width="1.5"/>
      <line x1="0" y1="50" x2="100" y2="50" stroke="#475569" stroke-width="1.5"/>

      <!-- Q1 (Top-Left) -->
      <line x1="0" y1="0" x2="50" y2="50" stroke="#38bdf8" stroke-width="2"/>
      <path d="M 0,25 A 25,25 0 0,0 25,50" fill="none" stroke="#38bdf8" stroke-width="2"/>

      <!-- Q2 (Top-Right) -->
      <line x1="100" y1="0" x2="50" y2="50" stroke="#38bdf8" stroke-width="2"/>
      <path d="M 100,25 A 25,25 0 0,1 75,50" fill="none" stroke="#38bdf8" stroke-width="2"/>

      <!-- Q3 (Bottom-Left) -->
      <line x1="0" y1="100" x2="50" y2="50" stroke="#38bdf8" stroke-width="2"/>
      <path d="M 0,75 A 25,25 0 0,1 25,50" fill="none" stroke="#38bdf8" stroke-width="2"/>

      <!-- Q4 (Bottom-Right Target '?') -->
      <rect x="52" y="52" width="46" height="46" fill="rgba(255, 215, 0, 0.1)" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3"/>
      <text x="75" y="82" fill="#ffd700" font-size="22" font-weight="900" text-anchor="middle">?</text>
    </g>

    <!-- Answer Figures -->
    <text x="180" y="48" fill="#94a3b8" font-size="11" font-weight="600">उत्तर आकृतियाँ :</text>
    <g transform="translate(175, 75)">
      <!-- Opt 1 -->
      <rect x="0" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <line x1="0" y1="0" x2="60" y2="60" stroke="#38bdf8" stroke-width="2"/>
      <text x="30" y="78" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(1)</text>

      <!-- Opt 2 -->
      <rect x="80" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <line x1="60" y1="0" x2="0" y2="60" stroke="#38bdf8" stroke-width="2"/>
      <text x="110" y="78" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(2)</text>

      <!-- Opt 3 -->
      <rect x="160" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#4ade80" stroke-width="2"/>
      <line x1="60" y1="60" x2="0" y2="0" stroke="#4ade80" stroke-width="2"/>
      <path d="M 60,30 A 30,30 0 0,1 30,0" fill="none" stroke="#4ade80" stroke-width="2"/>
      <text x="190" y="78" fill="#4ade80" font-size="11" font-weight="bold" text-anchor="middle">(3)</text>

      <!-- Opt 4 -->
      <rect x="240" y="0" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="270" y="78" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(4)</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 6. जल एवं दर्पण प्रतिबिंब (Water / Mirror Reflection with hatched line - as in NMMS MAT Q86-87)
export function generateWaterReflectionSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="100%" height="100%">
    <rect width="520" height="220" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="260" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      💧 जल प्रतिबिंब (Water Reflection)
    </text>

    <!-- Question Figure -->
    <text x="35" y="46" fill="#94a3b8" font-size="11" font-weight="600">प्रश्न आकृति :</text>
    <g transform="translate(35, 54)">
      <rect x="0" y="0" width="75" height="75" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="37.5" cy="37.5" r="20" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <polygon points="37.5,10 22,37.5 53,37.5" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="58" cy="37.5" r="4" fill="#38bdf8"/>
      
      <!-- Hatched Base Mirror Line -->
      <line x1="-5" y1="83" x2="80" y2="83" stroke="#0ea5e9" stroke-width="2.5"/>
      <line x1="0" y1="83" x2="-4" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="10" y1="83" x2="6" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="20" y1="83" x2="16" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="30" y1="83" x2="26" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="40" y1="83" x2="36" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="50" y1="83" x2="46" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="60" y1="83" x2="56" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
      <line x1="70" y1="83" x2="66" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>
    </g>

    <!-- Answer Figures -->
    <text x="160" y="46" fill="#94a3b8" font-size="11" font-weight="600">उत्तर आकृतियाँ :</text>
    <g transform="translate(155, 54)">
      <!-- Opt 1 -->
      <rect x="0" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="35" y="90" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(1)</text>

      <!-- Opt 2 -->
      <rect x="85" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#4ade80" stroke-width="2"/>
      <circle cx="120" cy="35" r="20" fill="none" stroke="#4ade80" stroke-width="2"/>
      <polygon points="120,60 105,35 135,35" fill="none" stroke="#4ade80" stroke-width="1.5"/>
      <circle cx="140" cy="35" r="4" fill="#4ade80"/>
      <text x="120" y="90" fill="#4ade80" font-size="11" font-weight="bold" text-anchor="middle">(2)</text>

      <!-- Opt 3 -->
      <rect x="170" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="205" y="90" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(3)</text>

      <!-- Opt 4 -->
      <rect x="255" y="0" width="70" height="70" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="290" y="90" fill="#cbd5e1" font-size="11" font-weight="bold" text-anchor="middle">(4)</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 7. संख्याओं का स्तूप (Number Pyramid / Stupa - as in NMMS MAT Q88-90)
export function generateNumberPyramidSvg() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="100%" height="100%">
    <rect width="480" height="260" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="240" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      🏛️ संख्याओं का विशिष्ट स्तूप (Number Pyramid)
    </text>

    <g transform="translate(240, 50)" font-family="Courier New, monospace" font-size="13" font-weight="900" fill="#f8fafc" text-anchor="middle">
      <text y="0" fill="#ffd700">36</text>
      <text y="24">34   35</text>
      <text y="48">33   32   31</text>
      <text y="72">27   28   29   30</text>
      <text y="96">26   25   24   23   22</text>
      <text y="120">16   17   18   19   20   21</text>
      <text y="144">15   14   13   12   11   10   9</text>
      <text y="168" fill="#38bdf8">1    2    3    4    5    6    7    8</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 8. 3D Isometric Dice (पासा)
export function generateDiceSvg(topNum = 3, leftNum = 1, rightNum = 2) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="100%" height="100%">
    <rect width="320" height="220" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <text x="160" y="24" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">🎲 पासा (Dice)</text>
    <g transform="translate(0, 10)">
      <polygon points="160,40 220,70 160,100 100,70" fill="#f1f5f9" stroke="#1e293b" stroke-width="2"/>
      <polygon points="100,70 160,100 160,170 100,140" fill="#cbd5e1" stroke="#1e293b" stroke-width="2"/>
      <polygon points="160,100 220,70 220,140 160,170" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
      <text x="160" y="75" fill="#0f172a" font-size="20" font-weight="900" text-anchor="middle">${topNum}</text>
      <text x="130" y="140" fill="#0f172a" font-size="20" font-weight="900" text-anchor="middle">${leftNum}</text>
      <text x="190" y="140" fill="#0f172a" font-size="20" font-weight="900" text-anchor="middle">${rightNum}</text>
    </g>
  </svg>
  `;
  return encodeSvgToDataUri(svg);
}

// 9. Smart Auto-Attacher matching NMMS MAT Question Paper
export function getSmartDiagramForQuestion(topic = '', questionText = '') {
  const combined = (topic + ' ' + questionText).toLowerCase();

  // 1. Number Pyramid / Stupa
  if (combined.includes('स्तूप') || combined.includes('pyramid') || combined.includes('stupa')) {
    return generateNumberPyramidSvg();
  }

  // 2. Geometrical Venn Diagram (Rectangle, Triangle, Circle)
  if (combined.includes('वेन') || combined.includes('venn') || (combined.includes('आयत') && combined.includes('त्रिभुज') && combined.includes('वृत्त'))) {
    return generateGeometryVennSvg();
  }

  // 3. Missing Number in Shapes (Circle / Square)
  if (combined.includes('लुप्त संख्या') || combined.includes('missing number') || (combined.includes('वृत्त') && combined.includes('संख्या'))) {
    return generateMissingNumberShapesSvg();
  }

  // 4. Pattern Completion (अपूर्ण आकृति)
  if (combined.includes('अपूर्ण आकृति') || combined.includes('pattern completion') || combined.includes('पूर्ण करने')) {
    return generatePatternCompletionSvg();
  }

  // 5. Water Reflection (जल प्रतिबिंब)
  if (combined.includes('जल') || combined.includes('water reflection') || combined.includes('पानी में प्रतिबिंब')) {
    return generateWaterReflectionSvg();
  }

  // 6. Figure Analogy (सादृश्यता : ::)
  if (combined.includes('सादृश्यता') || combined.includes('analogy') || combined.includes('प्रथम आकृति का द्वितीय आकृति')) {
    return generateFigureAnalogySvg();
  }

  // 7. Figure Series / Pattern Sequence (आकृति श्रृंखला)
  if (combined.includes('श्रृंखला') || combined.includes('series') || combined.includes('क्रमानुसार कौन सी आकृति') || combined.includes('प्रश्न आकृतियाँ') || combined.includes('figure')) {
    return generateFigureSeriesSvg();
  }

  // 8. Dice / Cubes (पासा)
  if (combined.includes('पासा') || combined.includes('dice') || combined.includes('घन') || combined.includes('cube')) {
    return generateDiceSvg();
  }

  return null;
}
