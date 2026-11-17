/** 홈 화면의 좌석 비네트: 객석에 불이 번지고, 내 자리 하나가 밝혀진다 */
const ROWS = 8;
const BEST_ROW = 5;
const CX = 300;
const CY = -560;

const mix = (t: number) => {
  const k = Math.max(0, Math.min(1, t)) ** 1.8 * 0.85;
  const c = (a: number, b: number) => Math.round(a + (b - a) * k);
  return `rgb(${c(27, 47)},${c(32, 184)},${c(41, 134)})`;
};

function buildSeats() {
  const out: { x: number; y: number; rot: number; fill: string; delay: number; best: boolean }[] = [];
  for (let r = 0; r < ROWS; r++) {
    const radius = 660 + r * 29;
    const n = 13 + r;
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const a = ((i - mid) * 27) / radius;
      const dist = Math.hypot((i - mid) / 6, (r - BEST_ROW) / 3.2);
      out.push({
        x: CX + radius * Math.sin(a),
        y: CY + radius * Math.cos(a),
        rot: (-a * 180) / Math.PI,
        fill: mix(1 - dist / 1.6),
        delay: Math.round(dist * 360),
        best: r === BEST_ROW && Math.abs(i - mid) < 1,
      });
    }
  }
  return out;
}

export default function HeroSeats() {
  const seats = buildSeats();
  const best = seats.filter((s) => s.best);
  const bx = (best[0].x + best[1].x) / 2;
  const by = best[0].y;
  return (
    <svg className="hero-seats" viewBox="0 0 600 340" role="img" aria-label="객석 가운데 내 자리 하나가 노랗게 밝혀진 좌석 지도">
      <defs>
        <linearGradient id="hs-spill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.09" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hs-glow">
          <stop offset="0" stopColor="#ffd23f" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M92 60 Q300 24 508 60 L560 250 Q300 200 40 250 Z" fill="url(#hs-spill)" />
      <path className="hs-screen" d="M92 60 Q300 24 508 60" fill="none" stroke="#eef1f5" strokeWidth="3.5" strokeLinecap="round" />
      <circle className="hs-glow" cx={bx} cy={by} r="62" fill="url(#hs-glow)" />
      {seats.map((s, i) => (
        <rect key={i} className={s.best ? 'hs hs-best' : 'hs'} x={s.x - 10.5} y={s.y - 8.5} width="21" height="17" rx="5.5"
          fill={s.best ? '#ffd23f' : s.fill} transform={`rotate(${s.rot.toFixed(2)} ${s.x.toFixed(1)} ${s.y.toFixed(1)})`}
          style={{ ['--d' as string]: `${s.delay}ms` }} />
      ))}
      <g className="hs-tag">
        <path d={`M${bx + 16} ${by - 12} L${bx + 44} ${by - 38}`} stroke="#ffd23f" strokeOpacity="0.6" strokeWidth="1.5" />
        <rect x={bx + 40} y={by - 78} width="124" height="46" rx="10" fill="#0b0d11" stroke="#ffd23f" strokeOpacity="0.5" />
        <text x={bx + 54} y={by - 59} fontSize="13.5" fontWeight="700" fill="#f3f5f8">H열 9~10번</text>
        <text x={bx + 54} y={by - 42} fontSize="11.5" fill="#a3acba">나와의 핏 <tspan fill="#ffd23f" fontWeight="700">100</tspan></text>
      </g>
    </svg>
  );
}
