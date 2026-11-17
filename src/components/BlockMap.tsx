'use client';
import type { BlockAnalysis } from '@/lib/engine/zone';
import { seatKey } from '@/lib/engine/zone';
import { heat } from './ui';

const STEP = 19;
const SIZE = 15;
const PAD_X = 40;
const TOP = 38;

interface Props {
  block: BlockAnalysis;
  sold: Set<string>;
  /** 추천 좌석: r열(0부터)의 k칸부터 n석 */
  pick?: { r: number; k: number; n: number } | null;
  color: string;
  /** 앞쪽에 있는 것: 무대·그라운드·코트 */
  toward: string;
  onSeat: (r: number, k: number) => void;
}

/** 구역 안 대표 블록의 좌석표. 예매 사이트의 블록 화면처럼 통로와 통로 사이 좌석을 열별로 보여 준다 */
export default function BlockMap({ block, sold, pick, color, toward, onSeat }: Props) {
  const { rows, cols, score } = block;
  const width = cols * STEP + PAD_X * 2;
  const height = rows * STEP + TOP + 14;
  const flat = score.flat();
  const min = Math.min(...flat);
  const range = Math.max(Math.max(...flat) - min, 0.0001);
  const isPick = (r: number, k: number) => !!pick && r === pick.r && k >= pick.k && k < pick.k + pick.n;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width * 1.25, minWidth: Math.min(width * 0.62, 400) }} role="img"
      aria-label={`좌석표. 위쪽이 ${toward} 방향, 양옆이 통로`}>
      <path d={`M${width / 2 - 5} 13 l5 -5 l5 5`} fill="none" stroke="#838d9d" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <text x={width / 2} y={27} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#838d9d">{toward} 방향</text>
      {[PAD_X - 13, width - PAD_X + 9].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={TOP} x2={x} y2={TOP + rows * STEP - 4} stroke="#363d4a" strokeWidth={1.5} strokeDasharray="3 4" />
          <text x={x} y={TOP - 7} textAnchor="middle" fontSize={9.5} fill="#838d9d">통로</text>
        </g>
      ))}
      {score.map((row, r) => (
        <g key={r}>
          <text x={PAD_X - 20} y={TOP + r * STEP + 11.5} textAnchor="end" fontSize={9.5} fill="#838d9d">{r + 1}</text>
          {row.map((v, k) => {
            const lit = isPick(r, k);
            const isSold = sold.has(seatKey(r, k));
            return (
              <rect key={k} className={lit ? 'seat is-pick' : 'seat'} x={PAD_X + k * STEP} y={TOP + r * STEP} width={SIZE} height={SIZE} rx={4}
                fill={lit ? color : isSold ? 'var(--seat-sold)' : heat((v - min) / range, 2)} stroke={isSold && !lit ? '#2f3541' : 'none'}
                onClick={() => onSeat(r, k)}>
                <title>{`${r + 1}열 · 통로에서 ${Math.min(k, cols - 1 - k) + 1}번째 칸${isSold ? ' · 매진' : ''}`}</title>
              </rect>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
