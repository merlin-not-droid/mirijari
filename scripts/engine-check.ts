// 추천 엔진 동작 확인: `npm run test:engine`
// 프로필이 달라지면 추천이 실제로 달라지는지, 결과가 상식에 맞는지 검증한다.
import assert from 'node:assert/strict';
import { DEFAULT_PROFILE } from '../src/lib/options.ts';
import type { Persona } from '../src/lib/types.ts';
import { makeCinema, THEATERS } from '../src/lib/data/grid.ts';
import { ARENAS, STADIUMS } from '../src/lib/data/zones.ts';
import { analyzeGrid, simulateSold, topPicks, rowProfile } from '../src/lib/engine/grid.ts';
import { analyzeZones, topZones } from '../src/lib/engine/zone.ts';
import { matchVenues } from '../src/lib/data/index.ts';

const persona = (over: Partial<Persona>): Persona => ({ ...DEFAULT_PROFILE, experience: 'gte5', style: 'immerse', category: 'movie', ...over });
const none = new Set<string>();
let passed = 0;
const check = (name: string, fn: () => void) => { fn(); passed++; console.log('  ✓', name); };
const rowOf = (id: string) => Number(id.split('-')[1]);

console.log('영화관 (중형 일반관 11행 × 16석)');
const hall = makeCinema({ hall: 'standard', rows: 11, cols: 16 });
const immerse = persona({ style: 'immerse', partySize: 2 });
const comfort = persona({ style: 'comfort', partySize: 2, flags: ['neck'] });
const pi = topPicks(analyzeGrid(hall, immerse), hall, immerse, none, 'open');
const pc = topPicks(analyzeGrid(hall, comfort), hall, comfort, none, 'open');
console.log('   몰입형:', pi.map((p) => `${p.label}(${p.score})`).join(' / '));
console.log('   편안함:', pc.map((p) => `${p.label}(${p.score})`).join(' / '));
check('후보 3개를 돌려준다', () => assert.equal(pi.length, 3));
check('몰입형은 편안함형보다 앞 열을 추천한다', () => assert.ok(rowOf(pi[0].seatIds![0]) < rowOf(pc[0].seatIds![0])));
check('맨 앞 열은 추천하지 않는다', () => assert.ok(rowOf(pi[0].seatIds![0]) >= 2));
check('2인이면 붙어 있는 2석을 준다', () => assert.equal(pi[0].seatIds!.length, 2));
const aisle = persona({ style: 'comfort', partySize: 1, flags: ['restroom'], sidePref: 'aisle' });
const aa = analyzeGrid(hall, aisle);
const pa = topPicks(aa, hall, aisle, none, 'open');
console.log('   통로 선호 1인:', pa.map((p) => p.label).join(' / '));
check('자주 나가는 사람은 통로 좌석을 받는다', () => assert.equal(aa.byId.get(pa[0].seatIds![0])!.aisleDist, 0));

const a = analyzeGrid(hall, immerse);
const sold = simulateSold(a, 0.7);
const pr = topPicks(a, hall, immerse, sold, 'remaining');
console.log('   예매율 70% 가정:', pr.map((p) => `${p.label}(${p.score})`).join(' / '));
check('매진 좌석은 추천하지 않는다', () => assert.ok(pr.every((p) => p.seatIds!.every((id) => !sold.has(id)))));
check('남은 자리 점수는 전체 최고점 이하', () => assert.ok(pr[0].score <= pi[0].score));
const pt = topPicks(a, hall, immerse, none, 'ticketing');
console.log('   티켓팅 전략:', pt.map((p) => `${p.label}(경쟁 ${Math.round(p.demand * 100)})`).join(' / '));
check('열별 프로필이 모든 행을 포함한다', () => assert.equal(rowProfile(a, hall, immerse, none).length, 11));

console.log('뮤지컬 (샤롯데씨어터)');
const th = THEATERS[0].venue;
const short = persona({ category: 'musical', style: 'whole', height: 153, partySize: 1 });
const tallFace = persona({ category: 'musical', style: 'face', height: 185, partySize: 1 });
const ps = topPicks(analyzeGrid(th, short), th, short, none, 'open');
const ptall = topPicks(analyzeGrid(th, tallFace), th, tallFace, none, 'open');
console.log('   153cm·전체 연출:', ps.map((p) => `${p.label}(${p.score})`).join(' / '));
console.log('   185cm·배우 표정:', ptall.map((p) => `${p.label}(${p.score})`).join(' / '));
check('키·취향이 다르면 1순위가 달라진다', () => assert.notEqual(ps[0].label, ptall[0].label));
check('표정 중시형은 1층을 받는다', () => assert.ok(ptall[0].label.startsWith('1층')));
check('추천마다 이유가 붙는다', () => assert.ok(ps.every((p) => p.reasons.length > 0)));

console.log('콘서트 (KSPO DOME)');
const arena = ARENAS[0].venue;
const shortFan = persona({ category: 'concert', style: 'close', height: 155 });
const tallFan = persona({ category: 'concert', style: 'close', height: 185 });
const zs = topZones(analyzeZones(arena, shortFan), arena, shortFan, none, 'open');
const zt = topZones(analyzeZones(arena, tallFan), arena, tallFan, none, 'open');
console.log('   155cm·가까이:', zs.map((p) => `${p.label}(${p.score})`).join(' / '));
console.log('   185cm·가까이:', zt.map((p) => `${p.label}(${p.score})`).join(' / '));
check('키 큰 팬은 플로어 앞, 작은 팬은 단차 있는 구역이 1순위', () => {
  assert.equal(zt[0].zoneId, 'floor-front');
  assert.notEqual(zs[0].zoneId, 'floor-front');
});
const zsold = topZones(analyzeZones(arena, tallFan), arena, tallFan, new Set(['floor-front']), 'remaining');
check('매진 구역은 제외된다', () => assert.ok(zsold.every((p) => p.zoneId !== 'floor-front')));

console.log('야구 (잠실야구장)');
const park = STADIUMS.baseball[0];
const cheer = persona({ category: 'sports', style: 'cheer', companion: 'friends' });
const family = persona({ category: 'sports', style: 'chill', companion: 'kids', flags: ['sun'] });
const bc = topZones(analyzeZones(park, cheer), park, cheer, none, 'open');
const bf = topZones(analyzeZones(park, family), park, family, none, 'open');
console.log('   친구·응원:', bc.map((p) => `${p.label}(${p.score})`).join(' / '));
console.log('   아이 동반·햇빛 민감:', bf.map((p) => `${p.label}(${p.score})`).join(' / '));
check('응원파는 홈 응원석이 1순위', () => assert.equal(bc[0].zoneId, 'home-low'));
check('아이 동반은 익사이팅존을 받지 않는다', () => assert.ok(bf.every((p) => p.zoneId !== 'exciting')));
check('열·좌우 조언이 붙는다', () => assert.ok(bc.every((p) => p.rowAdvice && p.sideAdvice)));

console.log('공연장 매칭 (KOPIS 시설명)');
const ids = (f: string) => matchVenues(f).venues.map((v) => v.id);
check('이름 일부만 같은 다른 시설은 매칭하지 않는다', () => {
  assert.deepEqual(ids('인스파이어 컬쳐홀'), []);
  assert.deepEqual(ids('청주예술의전당'), []);
});
check('정확한 시설명은 바로 매칭한다', () => {
  assert.deepEqual(ids('인스파이어 아레나'), ['inspire']);
  assert.ok(matchVenues('샤롯데씨어터').exact);
});
check('홀이 여러 개인 시설은 후보를 주고 사용자가 고르게 한다', () => {
  assert.deepEqual(ids('올림픽공원'), ['kspo', 'handball', 'olympic-hall']);
  assert.deepEqual(ids('예술의전당 [서울]'), ['sac-opera']);
  assert.equal(matchVenues('세종문화회관').exact, false);
});

console.log(`\n${passed}개 검증 통과`);
