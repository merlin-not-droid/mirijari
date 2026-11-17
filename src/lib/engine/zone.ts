import type { Mode, Persona, Pick, Zone, ZoneFactor, ZoneVenue } from '../types.ts';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const FACTORS: ZoneFactor[] = ['prox', 'view', 'cheer', 'quiet', 'comfort', 'sound', 'shade', 'access', 'value', 'family', 'food', 'sight', 'gentle'];

export function zoneWeights(p: Persona): Record<ZoneFactor, number> {
  const sports = p.category === 'sports';
  const w: Record<ZoneFactor, number> = sports
    ? { prox: 0.12, view: 0.22, cheer: 0.14, quiet: 0, comfort: 0.1, sound: 0, shade: 0.06, access: 0.06, value: 0.1, family: 0, food: 0.04, sight: 0.06, gentle: 0.02 }
    : { prox: 0.24, view: 0.16, cheer: 0.1, quiet: 0, comfort: 0.08, sound: 0.12, shade: 0, access: 0.04, value: 0.1, family: 0, food: 0, sight: 0.08, gentle: 0.02 };
  const boost = { first: 0.6, lt5: 0.85, gte5: 1, gte20: 1.25 }[p.experience];
  const has = (f: string) => p.flags.includes(f as never);

  if (sports) {
    if (p.style === 'cheer') w.cheer += 0.3 * boost;
    if (p.style === 'tactics') w.view += 0.3 * boost;
    if (p.style === 'close') w.prox += 0.3 * boost;
    if (p.style === 'chill') { w.food += 0.18 * boost; w.comfort += 0.14 * boost; }
    // 첫 직관: 경기가 잘 보이면서 응원 분위기도 느껴지는 무난한 구역으로
    if (p.experience === 'first') { w.view += 0.08; w.cheer += 0.06; w.access += 0.04; }
  } else {
    if (p.style === 'close') w.prox += 0.28 * boost;
    if (p.style === 'whole') w.view += 0.26 * boost;
    if (p.style === 'sound') { w.sound += 0.24 * boost; w.view += 0.04 * boost; }
    if (p.style === 'hype') { w.cheer += 0.24 * boost; w.prox += 0.08 * boost; }
    if (p.style === 'relax') { w.comfort += 0.2 * boost; w.access += 0.06 * boost; w.cheer *= 0.4; }
    if (p.experience === 'first') { w.view += 0.08; w.sight += 0.04; }
  }

  if (p.companion === 'kids') { w.family += 0.22; w.shade += 0.08; w.access += 0.08; w.gentle += 0.06; w.cheer *= 0.5; }
  if (p.companion === 'parents') { w.comfort += 0.12; w.access += 0.12; w.shade += 0.08; w.gentle += 0.1; w.cheer *= 0.5; }
  if (p.companion === 'couple') { w.comfort += 0.04; w.food += sports ? 0.04 : 0; }
  if (p.companion === 'friends') { w.cheer += 0.05; w.food += sports ? 0.05 : 0; }
  if (p.companion === 'group') w.food += sports ? 0.08 : 0;

  if (has('sun')) w.shade += 0.16;
  if (has('stairs')) { w.access += 0.14; w.gentle += 0.14; }
  if (has('noise')) { w.quiet += 0.14; w.cheer *= 0.3; }
  if (has('restroom')) w.access += 0.08;
  if (has('legroom')) w.comfort += 0.1;
  if (has('blocked')) w.sight += 0.1;
  if (has('neck')) w.comfort += 0.05;
  if (p.ageBand === '50plus') { w.comfort += 0.05; w.gentle += 0.05; }

  // 키가 작을수록 단차 없는 구역(플로어·스탠딩)에서 가려질 위험을 크게 본다
  w.sight += 0.2 * clamp01((165 - p.height) / 15);
  if (p.budget === 'value') w.value += 0.18;
  if (p.budget === 'premium') { w.value = 0; w.comfort += 0.08; w.prox += 0.06; }
  if (p.vision === 'weak') w.prox += 0.08;
  if (p.rowPref === 'front') w.prox += 0.08;
  if (p.rowPref === 'back') w.view += 0.06;

  const sum = FACTORS.reduce((a, k) => a + Math.max(0, w[k]), 0);
  FACTORS.forEach((k) => (w[k] = Math.max(0, w[k]) / sum));
  return w;
}

export function zoneFactors(z: Zone, p: Persona, standingFloor: boolean): Record<ZoneFactor, number> {
  const a = z.a;
  const standing = z.standing || (standingFloor && a.flat === 1);
  const tall = clamp01((p.height - 165) / 20);
  return {
    prox: a.prox, view: a.view, cheer: a.cheer, quiet: 1 - a.cheer,
    comfort: standing ? Math.min(a.comfort, 0.15) : a.comfort,
    sound: a.sound, shade: a.shade, access: a.access, value: 1 - a.price,
    family: standing ? Math.min(a.family, 0.15) : a.family, food: a.food,
    // 단차가 없어도 키가 크면 덜 가린다
    sight: 1 - a.flat * (1 - 0.6 * tall),
    gentle: 1 - a.steep,
  };
}

export interface ZoneAnalysis {
  weights: Record<ZoneFactor, number>;
  factors: Map<string, Record<ZoneFactor, number>>;
  totals: Map<string, number>;
  avg: Record<ZoneFactor, number>;
  max: number;
  min: number;
}

export function analyzeZones(v: ZoneVenue, p: Persona, standingFloor = false): ZoneAnalysis {
  const weights = zoneWeights(p);
  const factors = new Map<string, Record<ZoneFactor, number>>();
  const totals = new Map<string, number>();
  v.zones.forEach((z) => {
    const f = zoneFactors(z, p, standingFloor);
    factors.set(z.id, f);
    totals.set(z.id, FACTORS.reduce((a, k) => a + weights[k] * f[k], 0));
  });
  const avg = {} as Record<ZoneFactor, number>;
  FACTORS.forEach((k) => (avg[k] = v.zones.reduce((a, z) => a + factors.get(z.id)![k], 0) / v.zones.length));
  const vals = [...totals.values()];
  return { weights, factors, totals, avg, max: Math.max(...vals), min: Math.min(...vals) };
}

export const zonePoint = (a: ZoneAnalysis, id: string) => Math.round((a.totals.get(id)! / Math.max(a.max, 0.0001)) * 100);

const TEXT: Record<ZoneFactor, { sports: [string, string]; show: [string, string] }> = {
  prox: { sports: ['선수와 그라운드가 가까워 현장감이 커요', '그라운드와는 거리가 있어요'], show: ['무대와 가까워 아티스트가 잘 보여요', '무대와 거리가 있어 전광판을 함께 보게 돼요'] },
  view: { sports: ['경기 전체 흐름이 한눈에 들어오는 각도예요', '각도가 낮거나 치우쳐 전체 흐름은 아쉬워요'], show: ['무대 전체와 조명·전광판 연출이 정면으로 보여요', '측면·낮은 각도라 전체 연출은 아쉬워요'] },
  cheer: { sports: ['응원 열기가 뜨거운 구역이에요', '응원 분위기는 덜한 편이에요'], show: ['떼창과 열기가 가장 뜨거운 구역이에요', '열기는 다소 차분한 편이에요'] },
  quiet: { sports: ['응원 소음이 덜해 차분하게 볼 수 있어요', '응원 소리가 크게 들려요'], show: ['비교적 차분하게 감상할 수 있어요', '함성·스피커 소리가 커요'] },
  comfort: { sports: ['좌석이 편하고 여유가 있어요', '좌석이 좁거나 서 있는 시간이 길어요'], show: ['앉아서 편하게 볼 수 있어요', '좌석이 좁거나 서 있는 시간이 길어요'] },
  sound: { sports: ['', ''], show: ['음향 밸런스가 좋은 위치예요', '소리가 울리거나 한쪽으로 치우칠 수 있어요'] },
  shade: { sports: ['지붕·그늘이 있어 햇빛과 비를 피하기 좋아요', '햇빛과 비에 그대로 노출돼요'], show: ['실내·지붕 아래라 날씨 영향이 적어요', '야외라 날씨 영향을 받아요'] },
  access: { sports: ['출입구·화장실·매점 동선이 짧아요', '계단과 이동 동선이 길어요'], show: ['출입구·화장실 동선이 짧아요', '입퇴장 동선이 길어요'] },
  value: { sports: ['가격 대비 만족도가 높은 구역이에요', '가격대가 높은 구역이에요'], show: ['가격 대비 만족도가 높은 구역이에요', '가격대가 높은 구역이에요'] },
  family: { sports: ['아이·가족과 함께 보기 좋아요', '어린이 동반에는 주의가 필요해요'], show: ['가족과 함께 보기 무난해요', '어린이 동반에는 주의가 필요해요'] },
  food: { sports: ['먹거리를 즐기며 보기 좋아요', '먹거리 동선은 평범해요'], show: ['', ''] },
  sight: { sports: ['단차가 있어 앞사람에 덜 가려요', '단차가 적어 앞사람에 가릴 수 있어요'], show: ['단차가 있어 앞사람에 덜 가려요', '단차가 없어 앞사람에 가릴 수 있어요'] },
  gentle: { sports: ['경사가 완만해 오르내리기 편해요', '경사가 가파른 편이에요'], show: ['경사가 완만해 오르내리기 편해요', '경사가 가파른 편이에요'] },
};

function explainZone(a: ZoneAnalysis, z: Zone, p: Persona) {
  const f = a.factors.get(z.id)!;
  const kind = p.category === 'sports' ? 'sports' : 'show';
  const contrib = FACTORS.map((k) => ({ k, c: a.weights[k] * (f[k] - a.avg[k]) })).sort((x, y) => y.c - x.c);
  const text = (k: ZoneFactor, i: 0 | 1) => {
    const t = TEXT[k][kind][i];
    return k === 'sight' ? `키 ${p.height}cm 기준, ${t}` : t;
  };
  const reasons = contrib.filter((x) => x.c > 0.004).slice(0, 3).map((x) => text(x.k, 0)).filter(Boolean);
  const worst = contrib[contrib.length - 1];
  const tradeoff = worst.c < -0.004 ? text(worst.k, 1) : undefined;
  return { reasons, tradeoff };
}

// ───────── 구역 안에서 몇 열·몇 칸 ─────────
export interface SeatRule {
  standing: boolean;
  /** 권장 열 범위 (구역 전체 열 수 대비 비율) */
  lo: number;
  hi: number;
  rowWhy: string;
  side: 'aisle' | 'near' | 'center';
  sideWhy: string;
}

export function seatRule(z: Zone, p: Persona, standingFloor: boolean): SeatRule {
  const has = (f: string) => p.flags.includes(f as never);
  const standing = !!z.standing || (standingFloor && z.a.flat === 1);
  const short = p.height < 163;
  const tall = p.height >= 180;

  let row: [number, number, string];
  if (standing) {
    row = [0, 1, short
      ? '입장 번호가 빠르면 펜스(맨 앞), 아니면 구역 맨 뒤 벽 쪽 — 중간은 앞사람에 가려요'
      : tall ? '중간~뒤쪽에 서도 충분히 보여요. 뒤쪽이 덜 밀리고 편해요' : '중앙보다 살짝 사이드가 덜 밀려요'];
  } else if (z.rows <= 3) row = [0, 1, '열 수가 적어 어느 열이든 비슷해요'];
  else if (z.a.flat >= 0.6) {
    row = short ? [0.05, 0.2, '단차가 없어 중간 열은 앞사람에 가려요']
      : tall ? [0.3, 0.7, '어디서든 보이니 뒤쪽 배려석도 좋아요'] : [0.1, 0.4, '뒤로 갈수록 앞사람에 가려요'];
  } else if (has('stairs') || p.companion === 'parents' || p.companion === 'kids') {
    row = z.entry === 'top' ? [0.7, 1, '출입구와 가까워 계단을 적게 내려가요'] : [0.1, 0.35, '출입구와 가까워 계단을 적게 올라가요 (1열 난간 주의)'];
  } else if (has('sun') && z.a.shade < 1 && z.a.shade >= 0.4) row = [0.7, 1, '지붕 그늘이 먼저 드는 뒷열'];
  else if (p.rowPref === 'front' || p.style === 'close' || p.style === 'face') row = [0.12, 0.35, '가깝되 펜스·난간에 시야가 걸리지 않는 높이'];
  else if (p.rowPref === 'back' || p.style === 'tactics' || p.style === 'whole') row = [0.55, 0.85, '전체가 한눈에 들어오는 높이'];
  else if (short && z.a.cheer >= 0.8) row = [0.5, 0.8, '응원석은 서서 응원해 낮은 열은 가려요'];
  else if (z.a.steep >= 0.6) row = [0.1, 0.4, '위층은 앞쪽 열이 가깝고 덜 아찔해요 (1열 난간 주의)'];
  else row = [0.35, 0.65, '가까움과 전체 시야의 균형'];

  let side: [SeatRule['side'], string];
  if (standing) side = ['near', '짐은 최소화하고, 일행과 벗어나지 않게 위치를 정해 두세요'];
  else if (has('restroom') || p.companion === 'kids' || p.companion === 'parents' || tall || has('legroom'))
    side = ['aisle', '드나들기 편하고 다리 공간이 생겨요'];
  else if (p.sidePref === 'aisle' || p.style === 'chill') side = ['aisle', '매점·화장실 다녀오기 편해요'];
  else if (p.sidePref === 'center' || p.style === 'cheer' || p.style === 'hype') side = ['center', '지나다니는 사람 없이 몰입돼요'];
  else side = ['near', '출입은 편하고 방해는 덜 받아요'];

  return { standing, lo: row[0], hi: row[1], rowWhy: row[2], side: side[0], sideWhy: side[1] };
}

/** 한 블록(통로와 통로 사이)의 한 열 좌석 수 — 구역 성격에 따른 대표값 */
export const blockCols = (z: Zone) => (z.rows <= 3 ? 12 : z.a.comfort >= 0.9 ? 10 : z.a.flat === 1 ? 16 : z.a.steep >= 0.6 ? 22 : 20);
export const seatKey = (r: number, k: number) => `${r}-${k}`;

export interface BlockAnalysis {
  rows: number;
  cols: number;
  /** [열][칸] 0~1 */
  score: number[][];
  rule: SeatRule;
}

/** 구역의 대표 블록을 좌석 단위로 채점한다. 스탠딩 구역은 좌석이 없어 null */
export function analyzeBlock(z: Zone, p: Persona, standingFloor: boolean): BlockAnalysis | null {
  const rule = seatRule(z, p, standingFloor);
  if (rule.standing) return null;
  const rows = z.rows;
  const cols = blockCols(z);
  const mid = (rule.lo + rule.hi) / 2;
  const width = Math.max(0.2, rule.hi - rule.lo);
  const target = rule.side === 'aisle' ? 0 : rule.side === 'near' ? 2 : Math.floor((cols - 1) / 2);
  const score = Array.from({ length: rows }, (_, r) => {
    const f = rows === 1 ? 0.5 : r / (rows - 1);
    const rowScore = Math.exp(-(((f - mid) / width) ** 2));
    return Array.from({ length: cols }, (_, k) => {
      const d = Math.min(k, cols - 1 - k);
      return 0.65 * rowScore + 0.35 * Math.exp(-(((d - target) / 1.8) ** 2));
    });
  });
  return { rows, cols, score, rule };
}

/** 예매율 가정: 가운데·중간 열 같은 인기 좌석부터 팔린다고 본다 */
export function simulateBlockSold(rows: number, cols: number, rate: number, seed: number): Set<string> {
  let t = (seed * 2654435761) >>> 0;
  const rnd = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const order: { key: string; v: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const f = rows === 1 ? 0.5 : r / (rows - 1);
      const c = Math.abs(k - (cols - 1) / 2) / (cols / 2);
      order.push({ key: seatKey(r, k), v: Math.exp(-(((f - 0.4) / 0.35) ** 2)) * (1 - 0.5 * c) + (rnd() - 0.5) * 0.45 });
    }
  order.sort((a, b) => b.v - a.v);
  return new Set(order.slice(0, Math.round(order.length * Math.min(1, rate))).map((o) => o.key));
}

export interface BlockPick { r: number; k: number; n: number; score: number; split: boolean }

/** 블록에서 n명이 나란히 앉을 가장 좋은 남은 자리 */
export function bestBlockSeats(b: BlockAnalysis, sold: Set<string>, party: number): BlockPick | null {
  for (const [n, split] of [[Math.max(1, party), false], [Math.ceil(party / 2), true]] as const) {
    let best: BlockPick | null = null;
    for (let r = 0; r < b.rows; r++)
      for (let k = 0; k + n <= b.cols; k++) {
        let sum = 0;
        let ok = true;
        for (let i = 0; i < n; i++) {
          if (sold.has(seatKey(r, k + i))) { ok = false; break; }
          sum += b.score[r][k + i];
        }
        if (ok && (!best || sum / n > best.score)) best = { r, k, n, score: sum / n, split };
      }
    if (best || party <= 1) return best;
  }
  return null;
}

/** "13열 · 통로에서 3~4번째 칸" */
export function seatLine(b: BlockAnalysis, s: { r: number; k: number; n: number }): string {
  const d = Math.min(s.k, b.cols - s.k - s.n);
  const middle = d > 0 && d >= Math.floor((b.cols - s.n) / 2) ? '블록 한가운데, ' : '';
  const pos = d === 0
    ? (s.n === 1 ? '통로 바로 옆 칸' : `통로 바로 옆부터 ${s.n}칸`)
    : middle + (s.n === 1 ? `통로에서 ${d + 1}번째 칸` : `통로에서 ${d + 1}~${d + s.n}번째 칸`);
  return `${s.r + 1}열 · ${pos}`;
}

const rowRange = (z: Zone, rule: SeatRule) => {
  const a = Math.max(1, Math.round(z.rows * rule.lo));
  const b = Math.max(a, Math.round(z.rows * rule.hi));
  return a === b ? `${a}열` : `${a}~${b}열`;
};

/** 구역 안에서 몇 열·어느 쪽에 앉을지 (설명 문장) */
export function seatAdvice(z: Zone, p: Persona, standingFloor: boolean): { row: string; side: string } {
  const rule = seatRule(z, p, standingFloor);
  if (rule.standing) return { row: rule.rowWhy, side: rule.sideWhy };
  const row = z.rows <= 3 ? rule.rowWhy : `${rowRange(z, rule)} 권장 — ${rule.rowWhy}`;
  const where = { aisle: '통로 바로 옆', near: '통로에서 2~3칸 안쪽', center: '블록 안쪽(통로에서 4칸 이상)' }[rule.side];
  let side = `${where} — ${rule.sideWhy}`;
  if (p.partySize >= 3) side += `. ${p.partySize}연석이 없으면 앞뒤 두 줄로 나눠 잡으세요`;
  return { row, side };
}

const TITLES: Record<Mode, string[]> = {
  open: ['베스트 핏', '대안 A', '대안 B'],
  remaining: ['남은 자리 중 1순위', '2순위', '3순위'],
  ticketing: ['1순위 클릭', '2순위 (플랜 B)', '3순위 (플랜 C)'],
};

export function topZones(
  a: ZoneAnalysis, v: ZoneVenue, p: Persona, sold: Set<string>, mode: Mode, standingFloor = false,
  /** 구역별 매진 좌석 (남은 자리 모드). 없으면 전 좌석 예매 가능으로 본다 */
  soldSeats: (zoneId: string) => Set<string> = () => new Set(),
): Pick[] {
  return v.zones
    .filter((z) => !sold.has(z.id))
    .map((z) => {
      const block = analyzeBlock(z, p, standingFloor);
      const seat = block ? bestBlockSeats(block, soldSeats(z.id), p.partySize) : null;
      const fit = a.totals.get(z.id)!;
      // 남은 자리가 나쁜 구역은 구역 점수가 높아도 뒤로
      const seatFactor = block ? (seat ? 0.8 + 0.2 * seat.score : 0) : 1;
      return { z, block, seat, fit, adj: (mode === 'ticketing' ? fit * (1 - 0.3 * z.a.demand ** 3) : fit) * seatFactor };
    })
    .filter((c) => c.adj > 0)
    .sort((x, y) => y.adj - x.adj)
    .filter((c, i, all) => {
      // 티켓팅: 1순위보다 경쟁이 센 구역은 플랜 B·C에서 뒤로 미룬다
      if (mode !== 'ticketing' || i === 0) return true;
      const safer = all.filter((o) => o.z.a.demand < all[0].z.a.demand).length >= 2;
      return !safer || c.z.a.demand < all[0].z.a.demand;
    })
    .slice(0, 3)
    .map(({ z, block, seat }, i) => {
      const ex = explainZone(a, z, p);
      const adv = seatAdvice(z, p, standingFloor);
      return {
        rank: i + 1,
        title: TITLES[mode][i],
        label: z.name,
        where: z.desc,
        score: zonePoint(a, z.id),
        demand: z.a.demand,
        reasons: ex.reasons,
        tradeoff: z.caution && (p.companion === 'kids' || !ex.tradeoff) ? z.caution : ex.tradeoff,
        zoneId: z.id,
        seatLine: block && seat ? seatLine(block, seat) : '스탠딩 구역 — 좌석 번호 없이 서는 위치로 안내해요',
        blockSeat: seat ?? undefined,
        split: seat?.split,
        rowAdvice: adv.row,
        sideAdvice: adv.side,
      };
    });
}
