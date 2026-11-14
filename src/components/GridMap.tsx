'use client';
import { memo, useMemo } from 'react';
import type { GridVenue, Pick } from '@/lib/types';
import type { GridAnalysis } from '@/lib/engine/grid';
import { heat, PICK_COLORS } from './ui';

const STEP = 19;
const SIZE = 15;
const PAD = 30;

interface Props {
  venue: GridVenue;
  analysis: GridAnalysis;
  sold: Set<string>;
  picks: Pick[];
  selected: string | null;
  onSeat: (id: string) => void;
}

function GridMap({ venue, analysis, sold, picks, selected, onSeat }: Props) {
  const layout = useMemo(() => {
    const maxLen = Math.max(...venue.sections.flatMap((s) => s.cells.map((r) => r.length)));
    const width = maxLen * STEP + PAD * 2;
    let y = 46;
    const secs = venue.sections.map((s) => {
      const top = y + (venue.sections.length > 1 ? 22 : 0);
      let ry = top;
      const rowY = s.cells.map((_, r) => {
        if (s.crossAisles?.includes(r)) ry += 12;
        const cur = ry;
        ry += STEP;
        return cur;
      });
      y = ry + 14;
      return { top, rowY };
    });
    return { width, height: y, secs, maxLen };
  }, [venue]);

  const pickOf = useMemo(() => {
    const m = new Map<string, number>();
    picks.forEach((p) => p.seatIds?.forEach((id) => m.set(id, p.rank)));
    return m;
  }, [picks]);

  const { width, height, secs } = layout;
  const isScreen = venue.view === 'screen';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: Math.min(width * 0.6, 820), maxWidth: width * 1.5 }} role="img"
      aria-label={`${venue.name} 좌석 지도. 밝을수록 나에게 잘 맞는 자리`}>
      <path d={`M ${width * 0.14} 26 Q ${width / 2} ${isScreen ? 6 : 14} ${width * 0.86} 26`} fill="none" stroke="#dfe4ec" strokeWidth={isScreen ? 4 : 9} strokeLinecap="round" opacity={0.85} />
      <text x={width / 2} y={42} textAnchor="middle" fontSize={11} fill="#6b7483" fontWeight={700} letterSpacing={2}>{isScreen ? 'SCREEN' : 'STAGE'}</text>
      {venue.sections.map((s, si) => (
        <g key={s.id}>
          {venue.sections.length > 1 && (
            <text x={width / 2} y={secs[si].top - 8} textAnchor="middle" fontSize={12} fill="#98a1b0" fontWeight={700}>{s.name}</text>
          )}
          {s.cells.map((row, r) => {
            const y = secs[si].rowY[r];
            const x0 = (width - row.length * STEP) / 2;
            return (
              <g key={r}>
                <text x={x0 - 8} y={y + 11.5} textAnchor="end" fontSize={9.5} fill="#6b7483">{s.rowLabels[r]}</text>
                {[...row].map((ch, c) => {
                  if (ch === '_') return null;
                  const id = `${si}-${r}-${c}`;
                  const rank = pickOf.get(id);
                  const isSold = sold.has(id);
                  const t = analysis.pct.get(id)!;
                  return (
                    <rect key={c} className="seat" x={x0 + c * STEP} y={y} width={SIZE} height={SIZE} rx={4}
                      fill={rank ? PICK_COLORS[rank - 1] : isSold ? 'var(--seat-sold)' : heat(t, 2.4)}
                      stroke={selected === id ? '#fff' : isSold ? '#2f3541' : 'none'} strokeWidth={selected === id ? 2 : 1}
                      onClick={() => onSeat(id)} />
                  );
                })}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export default memo(GridMap);
