'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GridVenue, Mode, Persona, Pick, ZoneVenue } from '@/lib/types';
import { COMPANION, EXPERIENCE, FLAGS, MODES, ROW_PREF, SIDE_PREF, STYLES, VISION, labelOf } from '@/lib/options';
import { TICKETING_TIPS } from '@/lib/data';
import { analyzeGrid, explainSeat, rowProfile, seatLabel, simulateSold, toPoint, topPicks } from '@/lib/engine/grid';
import { analyzeZones, seatAdvice, topZones, zonePoint } from '@/lib/engine/zone';
import { fetchAiEnabled, postJson } from '@/lib/client';
import type { Target } from './TargetPicker';
import GridMap from './GridMap';
import ZoneMap from './ZoneMap';
import { demandBadge, PICK_COLORS, Seg } from './ui';

// ───────── 추천 카드 ─────────
function PickCard({ pick, mode, onFocus }: { pick: Pick; mode: Mode; onFocus?: () => void }) {
  const d = demandBadge(pick.demand);
  const vars = { ['--c' as string]: PICK_COLORS[pick.rank - 1], ['--i' as string]: pick.rank - 1 };
  return (
    <article className={pick.rank === 1 ? 'pick pick-top' : 'pick'} style={vars} onClick={onFocus}>
      <header className="pick-head">
        <span className="pick-rank" aria-hidden>{pick.rank}</span>
        <div className="pick-name">
          <p className="pick-title">{pick.title}</p>
          <h3 className="pick-label">{pick.label}</h3>
          {pick.zoneId && <p className="pick-where">{pick.where}</p>}
        </div>
        <p className="pick-score"><b>{pick.score}</b><span>핏</span></p>
      </header>
      <ul className="reasons">
        {pick.reasons.map((r) => <li key={r} className="plus">{r}</li>)}
        {pick.tradeoff && <li className="minus">{pick.tradeoff}</li>}
      </ul>
      {pick.rowAdvice && (
        <dl className="advice">
          <div><dt>몇 열</dt><dd>{pick.rowAdvice}</dd></div>
          <div><dt>좌우</dt><dd>{pick.sideAdvice}</dd></div>
        </dl>
      )}
      {(mode !== 'remaining' || pick.split) && (
        <div className="pick-foot">
          {mode !== 'remaining' && <span className={'badge ' + d.cls}>{d.text}</span>}
          {pick.split && <span className="badge">연석이 없어 나눠 앉는 조합</span>}
        </div>
      )}
    </article>
  );
}

// ───────── AI 코멘트 ─────────
function profileText(p: Persona) {
  return [
    `키 ${p.height}cm`, p.ageBand, `시력 ${labelOf(VISION, p.vision)}`,
    `${p.partySize}명(${labelOf(COMPANION, p.companion)})`, `경험 ${labelOf(EXPERIENCE, p.experience)}`,
    `가장 중요한 것: ${labelOf(STYLES[p.category], p.style)}`,
    `앞뒤 선호 ${labelOf(ROW_PREF, p.rowPref)}`, `좌우 선호 ${labelOf(SIDE_PREF, p.sidePref)}`,
    p.flags.length ? `해당 사항: ${p.flags.map((f) => labelOf(FLAGS, f)).join(', ')}` : '',
  ].filter(Boolean).join(', ');
}

function AiComment({ persona, venueName, mode, picks }: { persona: Persona; venueName: string; mode: Mode; picks: Pick[] }) {
  const [enabled, setEnabled] = useState(false);
  const [question, setQuestion] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { fetchAiEnabled().then(setEnabled); }, []);
  const key = picks.map((p) => p.label).join('|') + mode;
  useEffect(() => { setText(''); setError(''); }, [key]);

  if (!enabled)
    return process.env.NODE_ENV === 'development'
      ? <div className="notice plain">개발 안내: 서버 환경변수 ANTHROPIC_API_KEY를 설정하면 이 자리에 AI 코멘트(고민 상담)가 켜져요.</div>
      : null;

  const ask = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await postJson<{ text: string }>('/api/explain', {
        category: persona.category, venue: venueName, mode: MODES.find((m) => m.id === mode)!.label,
        profile: profileText(persona), question: question.trim() || undefined,
        picks: picks.map((p) => ({
          title: p.title, label: p.label, score: p.score, reasons: p.reasons, tradeoff: p.tradeoff,
          advice: p.rowAdvice ? `${p.rowAdvice} / ${p.sideAdvice}` : undefined,
        })),
      });
      setText(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card ai-box">
      <h2 className="card-title">AI에게 물어보기</h2>
      {text ? <p>{text}</p> : (
        <>
          <input className="text-input" maxLength={200} value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="고민을 적어 보세요 (선택) — 예: 맨 뒤랑 그 앞줄 중에 어디가 나을까요?" aria-label="고민" />
          <button type="button" className="btn ghost" style={{ marginTop: 10 }} disabled={busy || !picks.length} onClick={ask}>
            {busy ? <><span className="spinner" /> 생각하는 중…</> : 'AI 코멘트 받기'}
          </button>
        </>
      )}
      {error && <div className="notice" role="alert">{error}</div>}
    </section>
  );
}

// ───────── 격자형 (영화관·극장) ─────────
function GridResult({ venue, persona, mode, target }: { venue: GridVenue; persona: Persona; mode: Mode; target: Target }) {
  const analysis = useMemo(() => analyzeGrid(venue, persona), [venue, persona]);
  const captured = !!target.initialSold;
  const [rate, setRate] = useState(0.6);
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  // 가로로 넓은 공연장은 지도를 가운데부터 보여 준다
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [venue]);

  const sold = useMemo(() => {
    if (mode !== 'remaining') return new Set<string>();
    const s = captured ? new Set(target.initialSold) : simulateSold(analysis, rate);
    Object.entries(manual).forEach(([id, on]) => (on ? s.add(id) : s.delete(id)));
    return s;
  }, [mode, captured, target.initialSold, analysis, rate, manual]);

  const picks = useMemo(() => topPicks(analysis, venue, persona, sold, mode), [analysis, venue, persona, sold, mode]);
  const profile = useMemo(() => rowProfile(analysis, venue, persona, sold), [analysis, venue, persona, sold]);
  const bestSec = picks[0]?.seatIds ? Number(picks[0].seatIds[0].split('-')[0]) : 0;
  const [secTab, setSecTab] = useState<number | null>(null);
  const sec = secTab ?? bestSec;
  const rows = profile.filter((r) => r.sec === sec);
  const bestRow = Math.max(...rows.map((r) => r.score ?? 0));

  const onSeat = (id: string) => {
    if (editing && mode === 'remaining') setManual((m) => ({ ...m, [id]: !sold.has(id) }));
    else setSelected(id === selected ? null : id);
  };
  const sel = selected ? analysis.byId.get(selected) : undefined;
  const selInfo = sel ? explainSeat(analysis, venue, persona, sel) : null;
  const selPoint = selInfo ? toPoint(analysis, selInfo.score.total) : 0;

  return (
    <div className="result-cols">
      {mode === 'remaining' && !captured && (
        <section className="card r-controls">
          <h2 className="card-title">지금 얼마나 팔렸나요</h2>
          <div className="range-row">
            <output>{Math.round(rate * 100)}<small>% 예매</small></output>
            <input type="range" min={0} max={0.95} step={0.05} value={rate} aria-label="예매율" onChange={(e) => { setRate(Number(e.target.value)); setManual({}); }} />
          </div>
          <p className="seg-desc">인기 좌석부터 팔린다고 가정한 예시예요. 실제 예매 화면과 다르면 아래에서 좌석을 눌러 맞춰 주세요.</p>
          <button type="button" className={`btn small ${editing ? '' : 'ghost'}`} style={{ marginTop: 12 }} onClick={() => setEditing(!editing)}>
            {editing ? '표시 끝내기' : '매진 좌석 직접 표시하기'}
          </button>
        </section>
      )}
      {mode === 'remaining' && captured && <div className="notice r-controls">캡처에서 읽은 남은 자리 기준이에요. 인식이 틀린 좌석은 지도에서 눌러 고칠 수 있어요. <button type="button" className="link-btn" onClick={() => setEditing(!editing)}>{editing ? '수정 끝내기' : '수정하기'}</button></div>}

      <section className="map-card r-map">
        <div className="map-scroll" ref={scroller}>
          <GridMap venue={venue} analysis={analysis} sold={sold} picks={picks} selected={selected} onSeat={onSeat} />
        </div>
        {sel && selInfo && (
          <div className="detail">
            <h3><span>{seatLabel(venue, [sel])}{sold.has(sel.id) ? ' · 매진' : ''}</span><span>핏 {selPoint}{picks[0] && <small style={{ color: 'var(--muted)', fontWeight: 400 }}> · 1순위 대비 {selPoint - picks[0].score >= 0 ? '+' : ''}{selPoint - picks[0].score}</small>}</span></h3>
            <ul className="reasons">
              {selInfo.reasons.map((r) => <li key={r} className="plus">{r}</li>)}
              {selInfo.tradeoff && <li className="minus">{selInfo.tradeoff}</li>}
            </ul>
          </div>
        )}
        <div className="map-tools">
          <span className="legend">
            <span><i className="grad" />나와 안 맞음 → 잘 맞음</span>
            <span><i style={{ background: 'var(--seat-sold)', border: '1px solid #2f3541' }} />매진</span>
            <span><i style={{ background: 'var(--pick-1)' }} />추천</span>
          </span>
          <span>{editing ? '좌석을 눌러 매진 여부를 바꾸세요' : '좌석을 누르면 그 자리의 점수와 이유를 볼 수 있어요'}</span>
        </div>
      </section>

      <div className="r-picks">
        {picks.length ? picks.map((p) => <PickCard key={p.label} pick={p} mode={mode} onFocus={() => setSelected(p.seatIds![Math.floor((p.seatIds!.length - 1) / 2)])} />)
        : <p className="empty">남은 자리에서 {persona.partySize}명이 앉을 곳을 찾지 못했어요. 매진 표시를 줄이거나 인원을 나눠 보세요.</p>}
        <AiComment persona={persona} venueName={venue.name} mode={mode} picks={picks} />
      </div>

      <section className="card r-compare">
        <h2 className="card-title">열별로 비교하기 — 한 줄 앞? 한 줄 뒤?</h2>
        {venue.sections.length > 1 && <div style={{ marginBottom: 14 }}><Seg options={venue.sections.map((s, i) => ({ id: String(i), label: s.name }))} value={String(sec)} onChange={(v) => setSecTab(Number(v))} /></div>}
        <div className="bars">
          {rows.map((r) => (
            <div key={r.key} className={`bar${r.score === bestRow && r.score !== null ? ' best' : ''}${r.score === null ? ' off' : ''}`}>
              <span>{r.label}</span>
              <span className="track"><span className="fill" style={{ display: 'block', width: `${r.score ?? 0}%` }} /></span>
              <b>{r.score ?? '–'}</b>
            </div>
          ))}
        </div>
        <p className="seg-desc">각 열에서 {persona.partySize}명이 앉을 수 있는 가장 좋은 자리의 점수예요. 막대 차이가 작으면 어느 열이든 비슷하다는 뜻이에요.</p>
      </section>
    </div>
  );
}

// ───────── 구역형 (아레나·경기장) ─────────
function ZoneResult({ venue, persona, mode }: { venue: ZoneVenue; persona: Persona; mode: Mode }) {
  const [standing, setStanding] = useState(false);
  const [soldZones, setSoldZones] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const analysis = useMemo(() => analyzeZones(venue, persona, standing), [venue, persona, standing]);
  const sold = useMemo(() => new Set(mode === 'remaining' ? soldZones : []), [mode, soldZones]);
  const picks = useMemo(() => topZones(analysis, venue, persona, sold, mode, standing), [analysis, venue, persona, sold, mode, standing]);
  const ranked = useMemo(() => [...venue.zones].sort((a, b) => analysis.totals.get(b.id)! - analysis.totals.get(a.id)!), [venue, analysis]);
  const sel = venue.zones.find((z) => z.id === selected);
  const selAdvice = sel ? seatAdvice(sel, persona, standing) : null;
  const toggleSold = (id: string) => setSoldZones((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="result-cols">
      {venue.template === 'arena' && (
        <div className="summary r-controls">
          <span>플로어가 <b>{standing ? '스탠딩' : '좌석'}</b>인 공연으로 계산 중</span>
          <button type="button" className="link-btn" onClick={() => setStanding(!standing)}>{standing ? '좌석으로' : '스탠딩으로'} 바꾸기</button>
        </div>
      )}
      <section className="map-card r-map">
        <div className="map-scroll"><ZoneMap venue={venue} analysis={analysis} sold={sold} picks={picks} selected={selected} onZone={(id) => setSelected(id === selected ? null : id)} /></div>
        {sel && selAdvice && (
          <div className="detail">
            <h3><span>{sel.name}</span><span>핏 {zonePoint(analysis, sel.id)}</span></h3>
            <ul className="reasons"><li>{sel.desc}</li><li>몇 열 — {selAdvice.row}</li><li>좌우 — {selAdvice.side}</li>{sel.caution && <li className="minus">{sel.caution}</li>}</ul>
          </div>
        )}
        <div className="map-tools">
          <span className="legend"><span><i className="grad" />나와 안 맞음 → 잘 맞음</span><span><i style={{ background: 'var(--pick-1)' }} />추천</span></span>
          <span>구역을 누르면 몇 열에 앉을지 볼 수 있어요</span>
        </div>
      </section>

      <div className="r-picks">
        {picks.length ? picks.map((p) => <PickCard key={p.label} pick={p} mode={mode} onFocus={() => setSelected(p.zoneId!)} />) : <p className="empty">남은 구역이 없어요. 매진 표시를 확인해 주세요.</p>}
        <AiComment persona={persona} venueName={venue.name} mode={mode} picks={picks} />
      </div>

      <section className="card r-compare">
        <h2 className="card-title">{mode === 'remaining' ? '매진된 구역을 표시해 주세요' : '전체 구역 비교'}</h2>
        <div className="bars">
          {ranked.map((z, i) => (
            <div key={z.id} className="zone-row">
              <button type="button" className={`bar wide${i === 0 ? ' best' : ''}${sold.has(z.id) ? ' off' : ''}`} onClick={() => setSelected(z.id)}>
                <span>{z.name}</span>
                <span className="track"><span className="fill" style={{ display: 'block', width: `${zonePoint(analysis, z.id)}%` }} /></span>
                <b>{zonePoint(analysis, z.id)}</b>
              </button>
              {mode === 'remaining' && <button type="button" className={`sold-toggle${sold.has(z.id) ? ' on' : ''}`} aria-pressed={sold.has(z.id)} onClick={() => toggleSold(z.id)}>매진</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ───────── 결과 화면 ─────────
export default function Result({ target, persona }: { target: Target; persona: Persona }) {
  const { venue } = target;
  const [mode, setMode] = useState<Mode>(target.initialSold ? 'remaining' : target.state === '공연예정' ? 'ticketing' : 'open');
  return (
    <>
      <div className="result-head">
      <div className="venue-head">
        <h1>{venue.name}</h1>
        <p>{[target.title, venue.sub].filter(Boolean).join(' · ')}</p>
      </div>
      <Seg options={MODES} value={mode} onChange={setMode} />
      <p className="seg-desc">{MODES.find((m) => m.id === mode)!.desc}</p>
      {venue.note && <div className="notice plain">{venue.note}</div>}
      </div>

      {venue.kind === 'grid'
        ? <GridResult venue={venue} persona={persona} mode={mode} target={target} />
        : <ZoneResult venue={venue} persona={persona} mode={mode} />}

      {mode === 'ticketing' && (
        <section className="card">
          <h2 className="card-title">티켓팅 체크리스트</h2>
          <ol className="tips">{TICKETING_TIPS.map((t) => <li key={t}>{t}</li>)}</ol>
        </section>
      )}
      <p className="foot">
        {venue.approx ? '좌석 배치는 공개된 규모를 바탕으로 만든 근사 모델이에요. 열·번호가 예매처 좌석도와 다를 수 있으니 위치 감각(몇 열쯤, 중앙에서 몇 칸)으로 참고해 주세요. ' : ''}
        경쟁 예상은 실제 예매 데이터가 아닌 사전 추정치예요.
      </p>
    </>
  );
}
