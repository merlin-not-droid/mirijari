'use client';
import type { Pick, Shape, ZoneVenue } from '@/lib/types';
import type { ZoneAnalysis } from '@/lib/engine/zone';
import { heat, PICK_COLORS } from './ui';

// 야구장 부채꼴의 중심. 각도는 위쪽이 0°, 시계 방향
const C = { x: 200, y: 215 };
const pt = (r: number, a: number) => {
  const rad = (a * Math.PI) / 180;
  return [C.x + r * Math.sin(rad), C.y - r * Math.cos(rad)] as const;
};

function shapePath(s: Shape): string {
  if (s.t === 'rect') {
    const r = 6;
    return `M${s.x + r},${s.y} h${s.w - 2 * r} q${r},0 ${r},${r} v${s.h - 2 * r} q0,${r} ${-r},${r} h${-(s.w - 2 * r)} q${-r},0 ${-r},${-r} v${-(s.h - 2 * r)} q0,${-r} ${r},${-r} z`;
  }
  const large = s.a2 - s.a1 > 180 ? 1 : 0;
  const [x1, y1] = pt(s.r1, s.a1);
  const [x2, y2] = pt(s.r2, s.a1);
  const [x3, y3] = pt(s.r2, s.a2);
  const [x4, y4] = pt(s.r1, s.a2);
  return `M${x1},${y1} L${x2},${y2} A${s.r2},${s.r2} 0 ${large} 1 ${x3},${y3} L${x4},${y4} A${s.r1},${s.r1} 0 ${large} 0 ${x1},${y1} Z`;
}
const center = (s: Shape) => (s.t === 'rect' ? [s.x + s.w / 2, s.y + s.h / 2] : pt((s.r1 + s.r2) / 2, (s.a1 + s.a2) / 2));

const VIEWBOX = { baseball: '0 0 400 430', soccer: '0 0 400 300', court: '0 0 400 300', arena: '0 0 400 400' };
const label = { fontSize: 10, fill: '#8d96a5', fontWeight: 700 } as const;

function Field({ template }: { template: ZoneVenue['template'] }) {
  if (template === 'baseball')
    return (
      <g>
        <circle cx={C.x} cy={C.y} r={146} fill="#16291f" />
        <path d="M200,340 L344,196 M200,340 L56,196" stroke="#e8edf3" strokeWidth={1.2} opacity={0.5} />
        <path d="M200,340 L234,306 L200,272 L166,306 Z" fill="#4a3a26" stroke="#e8edf3" strokeWidth={1} opacity={0.9} />
        <circle cx={200} cy={306} r={4} fill="#6b563a" />
        <text x={262} y={300} {...label}>1루</text>
        <text x={122} y={300} {...label}>3루</text>
        <text x={200} y={150} textAnchor="middle" {...label}>외야</text>
      </g>
    );
  if (template === 'soccer')
    return (
      <g>
        <rect x={100} y={72} width={200} height={156} rx={4} fill="#16291f" stroke="#e8edf3" strokeOpacity={0.5} />
        <path d="M200,72 V228 M100,115 h28 v70 h-28 M300,115 h-28 v70 h28" fill="none" stroke="#e8edf3" strokeOpacity={0.45} />
        <circle cx={200} cy={150} r={20} fill="none" stroke="#e8edf3" strokeOpacity={0.45} />
      </g>
    );
  if (template === 'court')
    return (
      <g>
        <rect x={128} y={108} width={144} height={84} rx={3} fill="#3b2c1c" stroke="#e8edf3" strokeOpacity={0.5} />
        <path d="M200,108 V192" stroke="#e8edf3" strokeOpacity={0.45} />
        <circle cx={200} cy={150} r={12} fill="none" stroke="#e8edf3" strokeOpacity={0.45} />
      </g>
    );
  return (
    <g>
      <rect x={130} y={26} width={140} height={44} rx={8} fill="#dfe4ec" />
      <text x={200} y={53} textAnchor="middle" fontSize={12} fontWeight={800} fill="#161920" letterSpacing={2}>STAGE</text>
    </g>
  );
}

interface Props {
  venue: ZoneVenue;
  analysis: ZoneAnalysis;
  sold: Set<string>;
  picks: Pick[];
  selected: string | null;
  onZone: (id: string) => void;
}

export default function ZoneMap({ venue, analysis, sold, picks, selected, onZone }: Props) {
  const range = Math.max(analysis.max - analysis.min, 0.0001);
  const rankOf = new Map(picks.map((p) => [p.zoneId, p.rank]));
  return (
    <svg viewBox={VIEWBOX[venue.template]} style={{ width: '100%', maxWidth: 520 }} role="img" aria-label={`${venue.name} 구역 지도. 밝을수록 나에게 잘 맞는 구역`}>
      <defs>
        <pattern id="sold-hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={6} height={6} fill="#20242c" /><rect width={2} height={6} fill="#2f3541" />
        </pattern>
      </defs>
      <Field template={venue.template} />
      {venue.zones.map((z) => {
        const rank = rankOf.get(z.id);
        const t = (analysis.totals.get(z.id)! - analysis.min) / range;
        const fill = sold.has(z.id) ? 'url(#sold-hatch)' : rank ? PICK_COLORS[rank - 1] : heat(t);
        return (
          <g key={z.id} onClick={() => onZone(z.id)}>
            <title>{z.name}</title>
            {z.shapes.map((s, i) => (
              <path key={i} className={rank ? 'zone-shape is-pick' : 'zone-shape'} d={shapePath(s)} fill={fill} style={selected === z.id ? { stroke: '#fff', strokeWidth: 2.5 } : undefined} />
            ))}
            {rank && z.shapes.map((s, i) => {
              const [x, y] = center(s);
              return <text key={i} x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={900} fill="#161920" pointerEvents="none">{rank}</text>;
            })}
          </g>
        );
      })}
      {venue.template === 'soccer' && (<><text x={200} y={298} textAnchor="middle" {...label} fontSize={9}>W · 본부석</text><text x={64} y={64} textAnchor="middle" {...label} fontSize={9}>홈</text><text x={336} y={64} textAnchor="middle" {...label} fontSize={9}>원정</text></>)}
      {venue.template === 'court' && <text x={200} y={286} textAnchor="middle" {...label} fontSize={9}>홈 응원단 쪽</text>}
    </svg>
  );
}
