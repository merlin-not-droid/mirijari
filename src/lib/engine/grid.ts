import type { GridFactor, GridVenue, Mode, Persona, Pick, Seat, SeatScore } from '../types.ts';
import { DEFAULT_PROFILE } from '../options.ts';

const SEAT_W = 0.55;
const deg = (rad: number) => (rad * 180) / Math.PI;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const gauss = (delta: number, sigma: number) => Math.exp(-((delta / sigma) ** 2));
const FACTORS: GridFactor[] = ['view', 'close', 'center', 'neck', 'sound', 'sight', 'aisle', 'leg', 'value', 'hand'];

// ───────── 좌석 좌표 계산 ─────────
export function buildSeats(v: GridVenue): Seat[] {
  const seats: Seat[] = [];
  v.sections.forEach((s, sec) => {
    let elev = s.baseElev;
    s.cells.forEach((row, r) => {
      const rise = [...s.rise].reverse().find(([from]) => r >= from)?.[1] ?? 0.1;
      if (r > 0) elev += rise;
      let num = 0;
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '_') continue;
        num++;
        let left = 0;
        while (c - left - 1 >= 0 && row[c - left - 1] !== '_') left++;
        let right = 0;
        while (c + right + 1 < row.length && row[c + right + 1] !== '_') right++;
        seats.push({
          id: `${sec}-${r}-${c}`, sec, r, c, num,
          x: (c - (row.length - 1) / 2) * SEAT_W,
          d: s.firstRowDist + r * s.rowPitch,
          elev, xn: 0, depthFrac: 0,
          aisleDist: Math.min(left, right),
          frontOpen: r === 0 || !!s.crossAisles?.includes(r),
          overhang: s.overhangFromRow !== undefined && r >= s.overhangFromRow,
          railing: !!s.railing && r === 0,
          rise,
          tier: s.tiers ? [...s.tiers].reverse().find(([from]) => r >= from)?.[1] : undefined,
        });
      }
    });
  });
  const half = Math.max(...seats.map((s) => Math.abs(s.x)), 1);
  const maxD = Math.max(...seats.map((s) => s.d));
  const minD = Math.min(...seats.map((s) => s.d));
  seats.forEach((s) => {
    s.xn = s.x / half;
    s.depthFrac = maxD === minD ? 0.5 : (s.d - minD) / (maxD - minD);
  });
  return seats;
}

// ───────── 프로필 → 가중치 ─────────
export interface GridWeights { w: Record<GridFactor, number>; targetAngle: number }

export function gridWeights(p: Persona, v: GridVenue): GridWeights {
  const screen = v.view === 'screen';
  const w: Record<GridFactor, number> = screen
    ? { view: 0.3, close: 0, center: 0.2, neck: 0.12, sound: 0.08, sight: 0.08, aisle: 0.04, leg: 0.03, value: 0, hand: 0 }
    : p.category === 'musical'
      ? { view: 0.2, close: 0.22, center: 0.16, neck: 0.11, sound: 0.08, sight: 0.12, aisle: 0.03, leg: 0.03, value: 0.06, hand: 0 }
      : { view: 0.17, close: 0.25, center: 0.14, neck: 0.05, sound: 0.12, sight: 0.12, aisle: 0.04, leg: 0.03, value: 0.07, hand: 0 };
  // 경험이 많을수록 취향을 강하게, 처음이면 무난한 표준 명당 쪽으로
  const boost = { first: 0.6, lt5: 0.85, gte5: 1, gte20: 1.25 }[p.experience];
  let target = 42 + ({ imax: 10, dolby: 2, '4dx': -2, screenx: -4, standard: 0, recliner: 0 }[v.hall ?? 'standard'] ?? 0);

  if (screen) {
    if (p.style === 'immerse') { target += 9 * boost; w.view += 0.08 * boost; }
    if (p.style === 'comfort') { target -= 6 * boost; w.neck += 0.12 * boost; w.leg += 0.04 * boost; }
    if (p.style === 'sound') w.sound += 0.22 * boost;
    if (p.style === 'subtitle') { target -= 4 * boost; w.neck += 0.08 * boost; w.center += 0.05 * boost; }
    if (p.rowPref === 'front') target += 9;
    if (p.rowPref === 'back') target -= 8;
    if (p.vision === 'weak') target += 5;
    if (p.flags.includes('motion')) target -= v.hall === '4dx' || v.hall === 'imax' ? 9 : 5;
    if (p.companion === 'kids') target -= 4;
  } else {
    if (p.style === 'face' || p.style === 'close') w.close += 0.28 * boost;
    if (p.style === 'whole') w.view += 0.2 * boost;
    if (p.style === 'sound') { w.sound += 0.19 * boost; w.center += 0.04 * boost; }
    if (p.style === 'value') w.value += 0.2 * boost;
    if (p.style === 'hype') { w.close += 0.12 * boost; w.center += 0.08 * boost; }
    if (p.style === 'relax') { w.aisle += 0.08 * boost; w.leg += 0.08 * boost; w.neck += 0.05 * boost; }
    if (p.rowPref === 'front') w.close += 0.12;
    if (p.rowPref === 'middle') w.view += 0.03;
    if (p.rowPref === 'back') { w.view += 0.08; w.value += 0.04; }
    if (p.vision === 'weak') w.close += 0.1;
    if (p.budget === 'value') w.value += 0.14;
    if (p.budget === 'premium') w.value = 0;
  }

  if (p.height < 163) w.sight += 0.1 * clamp01((163 - p.height) / 13);
  if (p.height >= 183) { w.leg += 0.08; w.aisle += 0.04; }
  const has = (f: string) => p.flags.includes(f as never);
  if (has('restroom')) w.aisle += 0.14;
  if (has('legroom')) { w.leg += 0.12; w.aisle += 0.04; }
  if (has('neck')) { w.neck += 0.12; if (screen) target -= 4; }
  if (has('motion')) w.neck += 0.04;
  if (has('blocked')) w.sight += 0.1;
  if (has('stairs')) w.aisle += 0.06;
  if (p.companion === 'kids') { w.aisle += 0.1; w.sight += 0.08; }
  if (p.companion === 'parents') { w.aisle += 0.08; w.neck += 0.08; w.leg += 0.05; }
  if (p.companion === 'couple') w.center += 0.03;
  if (p.sidePref === 'center') { w.center += 0.12; w.aisle *= 0.3; }
  if (p.sidePref === 'aisle') { w.aisle += 0.18; w.center *= 0.6; }
  // 사용자 가설(주 사용 손) — 근거가 약해 영향은 작게만 반영
  if (p.hand !== 'na') w.hand = 0.02;

  const sum = FACTORS.reduce((a, k) => a + Math.max(0, w[k]), 0);
  FACTORS.forEach((k) => (w[k] = Math.max(0, w[k]) / sum));
  return { w, targetAngle: target };
}

// ───────── 좌석 1개 채점 ─────────
export function scoreSeat(s: Seat, v: GridVenue, p: Persona, gw: GridWeights): SeatScore {
  const eye = s.elev + 0.43 + 0.455 * (p.height / 100);
  const { width: W, height: H, bottom: B } = v.target;
  const f = {} as Record<GridFactor, number>;
  let angle = 0, neckAngle = 0, dist = s.d, lookDown = 0;

  if (v.view === 'screen') {
    angle = deg(2 * Math.atan(W / 2 / s.d));
    f.view = gauss(angle - gw.targetAngle, angle > gw.targetAngle ? 12 : 7);
    neckAngle = deg(Math.atan((B + H / 2 - eye) / s.d));
    f.neck = clamp01(1 - (neckAngle - 8) / 17);
    f.close = 0;
    f.value = 0.5;
  } else {
    const actor = B + H;
    const dd = s.d + 3;
    dist = Math.hypot(dd, s.x, eye - actor);
    // 약 9m 안쪽은 표정이 충분히 보여 더 가까워져도 이득이 없다고 본다
    f.close = clamp01(1 - (dist - 9) / (p.vision === 'weak' ? 11 : 14));
    angle = deg(2 * Math.atan(W / 2 / dd));
    lookDown = deg(Math.atan((eye - B) / dd));
    const floorVis = clamp01((lookDown + 1) / 9);
    const tooSteep = clamp01((lookDown - 28) / 14);
    f.view = (0.5 * gauss(angle - 36, angle > 36 ? 20 : 13) + 0.5 * floorVis) * (1 - 0.5 * tooSteep) * (s.overhang ? 0.8 : 1);
    // 배우가 무대 앞쪽까지 나오는 장면 기준
    neckAngle = deg(Math.atan((actor - eye) / (s.d + 1.5)));
    f.neck = clamp01(1 - (neckAngle - 6) / 14);
    f.value = s.tier ? { VIP: 0.15, R: 0.45, S: 0.8, A: 1 }[s.tier] : 0.5;
  }

  f.center = 1 - Math.abs(s.xn) ** 1.5;
  f.sound = gauss(s.depthFrac - 0.6, 0.25) * gauss(s.xn, 0.5) * (s.overhang ? 0.7 : 1);
  // 앞사람 머리에 가릴 위험: 열 단차 + 내 앉은 눈높이(평균 170cm 대비)
  const eyeDelta = (0.455 * (p.height - 170)) / 100;
  let sight = clamp01((s.rise + eyeDelta + (s.frontOpen ? 0.3 : 0)) / 0.22);
  if (s.railing) sight = Math.min(sight, clamp01(1 - (165 - p.height) / 20));
  if (s.overhang) sight *= 0.9;
  f.sight = sight;
  f.aisle = [1, 0.6, 0.3][s.aisleDist] ?? 0;
  // 극장 1열은 앞이 오케스트라 피트 벽이라 다리 공간 이점이 없다
  const openLeg = s.frontOpen && (v.view === 'screen' || s.r > 0);
  f.leg = v.hall === 'recliner' || openLeg ? 1 : s.aisleDist === 0 ? 0.6 : 0.25;
  f.hand = p.hand === 'na' ? 0.5 : clamp01(0.5 + (p.hand === 'right' ? -1 : 1) * s.xn * 4);

  const total = FACTORS.reduce((a, k) => a + gw.w[k] * f[k], 0);
  return { total, f, meta: { angle, neckAngle, dist, lookDown } };
}

// ───────── 전체 분석 ─────────
const NEUTRAL = (category: Persona['category'], style: string): Persona => ({
  ...DEFAULT_PROFILE, height: 170, partySize: 1, companion: 'solo', experience: 'gte5', style, category,
});

export interface GridAnalysis {
  seats: Seat[];
  byId: Map<string, Seat>;
  scores: Map<string, SeatScore>;
  /** 0~1. 일반적인 관객 기준 인기 순위(사전 추정) */
  demand: Map<string, number>;
  weights: GridWeights;
  avg: Record<GridFactor, number>;
  /** 0~1. 이 관객 기준 점수의 백분위 — 지도 색상용 */
  pct: Map<string, number>;
  min: number;
  max: number;
}

export function analyzeGrid(v: GridVenue, p: Persona): GridAnalysis {
  const seats = buildSeats(v);
  const weights = gridWeights(p, v);
  const scores = new Map<string, SeatScore>();
  seats.forEach((s) => scores.set(s.id, scoreSeat(s, v, p, weights)));

  const neutral = NEUTRAL(p.category, 'neutral');
  const nw = gridWeights(neutral, v);
  const ranked = seats
    .map((s) => ({ id: s.id, t: scoreSeat(s, v, neutral, nw).total }))
    .sort((a, b) => a.t - b.t);
  const demand = new Map<string, number>();
  ranked.forEach((r, i) => demand.set(r.id, ranked.length > 1 ? i / (ranked.length - 1) : 1));

  const avg = {} as Record<GridFactor, number>;
  FACTORS.forEach((k) => (avg[k] = seats.reduce((a, s) => a + scores.get(s.id)!.f[k], 0) / seats.length));
  const totals = seats.map((s) => scores.get(s.id)!.total);
  const pct = new Map<string, number>();
  [...seats].sort((x, y) => scores.get(x.id)!.total - scores.get(y.id)!.total)
    .forEach((s, i) => pct.set(s.id, seats.length > 1 ? i / (seats.length - 1) : 1));
  return {
    pct,
    seats, byId: new Map(seats.map((s) => [s.id, s])), scores, demand, weights, avg,
    min: Math.min(...totals), max: Math.max(...totals),
  };
}

/** 예매율 가정 시뮬레이션: 인기 좌석부터 팔린다고 보고 매진 좌석 집합을 만든다 */
export function simulateSold(a: GridAnalysis, rate: number, seed = 7): Set<string> {
  let t = seed >>> 0;
  const rnd = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const order = a.seats
    .map((s) => ({ id: s.id, k: a.demand.get(s.id)! + (rnd() - 0.5) * 0.35 }))
    .sort((x, y) => y.k - x.k);
  return new Set(order.slice(0, Math.round(order.length * rate)).map((o) => o.id));
}

// ───────── 표기 ─────────
export function seatLabel(v: GridVenue, seats: Seat[]): string {
  const s0 = seats[0];
  const sec = v.sections[s0.sec];
  const row = sec.rowLabels[s0.r] ?? String(s0.r + 1);
  const nums = seats.length > 1 ? `${s0.num}~${seats[seats.length - 1].num}번` : `${s0.num}번`;
  return `${v.sections.length > 1 ? sec.name + ' ' : ''}${row}열 ${nums}`;
}

export const toPoint = (a: GridAnalysis, total: number) => Math.round((total / Math.max(a.max, 0.0001)) * 100);

// ───────── 추천 이유 문장 ─────────
function reasonText(k: GridFactor, positive: boolean, s: Seat, sc: SeatScore, v: GridVenue, p: Persona, target: number): string {
  const screen = v.view === 'screen';
  const m = sc.meta;
  const fromCenter = Math.round(Math.abs(s.x) / SEAT_W);
  if (positive) {
    switch (k) {
      case 'view':
        if (screen) {
          const tone = m.angle >= 48 ? '화면이 시야를 꽉 채우는 몰입 거리' : m.angle >= 38 ? '화면 전체가 한눈에 들어오는 표준 거리' : '눈이 편안한 여유 있는 거리';
          return `스크린이 시야각 약 ${Math.round(m.angle)}°로 들어와요 — ${tone}`;
        }
        return m.lookDown >= 8 ? '무대 바닥까지 내려다보여 군무·조명 연출이 잘 보여요' : '무대 전체가 고개를 돌리지 않고 한 시야에 들어와요';
      case 'close': return `무대까지 약 ${Math.round(m.dist)}m — ${m.dist <= 13 ? '표정이 맨눈으로 보이는 거리' : '무대와의 거리가 적당해요'}`;
      case 'center': return fromCenter <= 1 ? `좌우 정중앙이라 ${screen ? '화면이' : '무대가'} 반듯하게 보여요` : `좌우 중앙에서 ${fromCenter}칸 — 왜곡이 거의 없어요`;
      case 'neck': return m.neckAngle <= 5 ? `${screen ? '스크린 중앙이' : '배우가'} 거의 눈높이라 목이 편해요` : `올려다보는 각도가 약 ${Math.round(m.neckAngle)}°로 완만해 목 부담이 적어요`;
      case 'sound': return '음향 기준점(객석 중앙 약 2/3 지점)에 가까워 소리 밸런스가 좋아요';
      case 'sight': return s.frontOpen ? '바로 앞이 통로(또는 첫 열)라 앞사람 머리에 가릴 일이 없어요' : `키 ${p.height}cm 기준으로도 열 단차(${Math.round(s.rise * 100)}cm)가 충분해 앞사람에 덜 가려요`;
      case 'aisle': return s.aisleDist === 0 ? '통로 바로 옆이라 중간에 드나들기 편해요' : `통로에서 ${s.aisleDist}칸이라 출입이 수월해요`;
      case 'leg': return v.hall === 'recliner' ? '좌석 간격이 넓어 다리를 뻗을 수 있어요' : s.frontOpen ? '앞 공간이 트여 있어 다리 공간에 여유가 있어요' : '통로 쪽으로 다리를 뻗을 수 있어요';
      case 'value': return `${s.tier ?? ''}석 가운데 시야가 좋은 가성비 구간이에요`;
      case 'hand': return `${p.hand === 'right' ? '오른손' : '왼손'}잡이 기준으로 살짝 ${p.hand === 'right' ? '왼쪽' : '오른쪽'}에 배치했어요 (영향은 작게 반영)`;
    }
  }
  switch (k) {
    case 'view':
      if (screen) return m.angle > target ? '화면이 다소 크게 느껴질 수 있어요' : '화면이 조금 멀게 느껴질 수 있어요';
      return m.lookDown < 4 ? '무대 바닥 연출은 잘 안 보여요' : '무대 전체를 보기엔 각도가 아쉬워요';
    case 'close': return `무대까지 약 ${Math.round(m.dist)}m라 표정은 오페라글라스가 있으면 좋아요`;
    case 'center': return '중앙에서 벗어나 살짝 비스듬하게 보여요';
    case 'neck': return `약 ${Math.round(m.neckAngle)}° 올려다봐야 해서 목이 피로할 수 있어요`;
    case 'sound': return s.overhang ? '위층 발코니 아래라 소리가 다소 먹먹할 수 있어요' : '음향 중심에서는 조금 벗어나 있어요';
    case 'sight': return s.railing ? '첫 열 안전 난간이 시야에 걸릴 수 있어요' : `열 단차가 낮아(${Math.round(s.rise * 100)}cm) 앞사람 머리에 가릴 수 있어요`;
    case 'aisle': return '안쪽 자리라 중간에 나가기는 번거로워요';
    case 'leg': return '다리 공간은 평범해요';
    case 'value': return `${s.tier ?? '상위'}석이라 가격대가 높아요`;
    case 'hand': return '주 사용 손 기준 선호 방향과는 반대쪽이에요';
  }
}

export function explainSeat(a: GridAnalysis, v: GridVenue, p: Persona, s: Seat) {
  const sc = a.scores.get(s.id)!;
  const contrib = FACTORS.map((k) => ({ k, c: a.weights.w[k] * (sc.f[k] - a.avg[k]) })).sort((x, y) => y.c - x.c);
  const reasons = contrib.filter((x) => x.c > 0.004).slice(0, 3).map((x) => reasonText(x.k, true, s, sc, v, p, a.weights.targetAngle));
  const worst = contrib[contrib.length - 1];
  const tradeoff = worst.c < -0.004 ? reasonText(worst.k, false, s, sc, v, p, a.weights.targetAngle) : undefined;
  return { reasons, tradeoff, score: sc };
}

// ───────── 연석 블록 & TOP 3 ─────────
interface Block { seats: Seat[]; fit: number; adj: number; demand: number }

function blocks(a: GridAnalysis, n: number, sold: Set<string>, mode: Mode): Block[] {
  const rows = new Map<string, Seat[]>();
  a.seats.forEach((s) => {
    const k = `${s.sec}-${s.r}`;
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k)!.push(s);
  });
  const out: Block[] = [];
  rows.forEach((row) => {
    for (let i = 0; i + n <= row.length; i++) {
      const b = row.slice(i, i + n);
      if (b[n - 1].c - b[0].c !== n - 1) continue; // 통로를 건너는 조합 제외
      if (b.some((s) => sold.has(s.id))) continue;
      const totals = b.map((s) => a.scores.get(s.id)!.total);
      const fit = 0.75 * (totals.reduce((x, y) => x + y, 0) / n) + 0.25 * Math.min(...totals);
      const demand = b.reduce((x, s) => x + a.demand.get(s.id)!, 0) / n;
      // 티켓팅 모드: 누구나 노리는 초인기 좌석은 실패 확률만큼 감점
      const adj = mode === 'ticketing' ? fit * (1 - 0.3 * demand ** 3) : fit;
      out.push({ seats: b, fit, adj, demand });
    }
  });
  return out.sort((x, y) => y.adj - x.adj);
}

/** "통로에서 3번째 칸 · 중앙에서 2칸" */
function positionLine(seats: Seat[]): string {
  const aisle = Math.min(...seats.map((s) => s.aisleDist));
  // 두 자리가 중앙선을 사이에 두면(0.5칸) 정중앙으로 본다
  const center = Math.floor(Math.min(...seats.map((s) => Math.abs(s.x))) / SEAT_W + 0.4);
  const a = aisle === 0 ? '통로 바로 옆' : `통로에서 ${aisle + 1}번째 칸`;
  return `${a} · ${center === 0 ? '좌우 정중앙' : `중앙에서 ${center}칸`}`;
}

const TITLES: Record<Mode, string[]> = {
  open: ['베스트 핏', '대안 A', '대안 B'],
  remaining: ['남은 자리 중 1순위', '2순위', '3순위'],
  ticketing: ['1순위 클릭', '2순위 (플랜 B)', '3순위 (플랜 C)'],
};

export function topPicks(a: GridAnalysis, v: GridVenue, p: Persona, sold: Set<string>, mode: Mode): Pick[] {
  let n = Math.max(1, p.partySize);
  let split = false;
  let cand = blocks(a, n, sold, mode);
  if (!cand.length && n > 1) {
    // 원하는 연석이 없으면 절반씩 나눠 앉는 조합으로
    n = Math.ceil(n / 2);
    split = true;
    cand = blocks(a, n, sold, mode);
  }
  const chosen: Block[] = [];
  for (const relax of [false, true]) for (const b of cand) {
    if (chosen.length === 3) break;
    if (chosen.includes(b)) continue;
    const mid = b.seats[Math.floor(b.seats.length / 2)];
    const mids = chosen.map((c) => c.seats[Math.floor(c.seats.length / 2)]);
    // 2순위는 앞뒤로 다른 열(또는 다른 층), 3순위는 앞의 둘과 겹치지 않는 위치 — 서로 다른 선택지가 되도록
    const sameBand = (cm: Seat) => cm.sec === mid.sec && Math.abs(cm.r - mid.r) <= 1;
    const ok = chosen.length === 1
      ? !sameBand(mids[0])
      : !mids.some((cm) => sameBand(cm) && Math.abs(cm.c - mid.c) < n + 3);
    // 티켓팅: 뒤 순위일수록 경쟁이 덜한 자리여야 플랜 B·C로 의미가 있다
    const safer = mode !== 'ticketing' || !chosen.length || relax || b.demand <= chosen[chosen.length - 1].demand - 0.08;
    if (ok && safer) chosen.push(b);
  }
  return chosen.map((b, i) => {
    const mid = b.seats[Math.floor((b.seats.length - 1) / 2)];
    const ex = explainSeat(a, v, p, mid);
    return {
      rank: i + 1,
      title: TITLES[mode][i],
      label: seatLabel(v, b.seats),
      where: v.sections.length > 1 ? v.sections[mid.sec].name : `${v.sections[0].rowLabels[mid.r]}열`,
      score: toPoint(a, b.fit),
      demand: b.demand,
      reasons: ex.reasons,
      tradeoff: ex.tradeoff,
      seatLine: positionLine(b.seats),
      seatIds: b.seats.map((s) => s.id),
      split,
    };
  });
}

/** 열별 최고 점수 — "맨 뒤 vs 그 앞줄" 고민용 */
export function rowProfile(a: GridAnalysis, v: GridVenue, p: Persona, sold: Set<string>) {
  const n = Math.max(1, p.partySize);
  const best = new Map<string, number>();
  blocks(a, n, sold, 'open').forEach((b) => {
    const k = `${b.seats[0].sec}-${b.seats[0].r}`;
    if (!best.has(k)) best.set(k, b.fit);
  });
  const out: { key: string; sec: number; label: string; score: number | null }[] = [];
  v.sections.forEach((s, sec) =>
    s.cells.forEach((_, r) => {
      const k = `${sec}-${r}`;
      out.push({ key: k, sec, label: `${s.rowLabels[r]}열`, score: best.has(k) ? toPoint(a, best.get(k)!) : null });
    }),
  );
  return out;
}
