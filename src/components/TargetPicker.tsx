'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, EventItem, HallType, MovieItem, Snapshot, Sport, Venue } from '@/lib/types';
import { SPORTS } from '@/lib/options';
import { DATA_AS_OF, matchVenues, venuesFor } from '@/lib/data';
import { CINEMA_PRESETS, CINEMA_SIZES, HALLS, makeCinema } from '@/lib/data/grid';
import { STADIUMS } from '@/lib/data/zones';
import { fetchAiEnabled, loadSnapshot, postJson, shrinkImage } from '@/lib/client';
import { Chips, Field, Seg, Stepper } from './ui';
import Icon from './Icon';
import AdSlot from './AdSlot';

export interface Target {
  venue: Venue;
  title?: string;
  /** KOPIS 공연 상태 (공연예정 / 공연중) */
  state?: string;
  /** 캡처 인식으로 얻은 매진 좌석 */
  initialSold?: string[];
}

const VenueRow = ({ v, onClick }: { v: Venue; onClick: () => void }) => (
  <button type="button" className="row" onClick={onClick}>
    <div className="grow"><h3>{v.name}</h3><p>{v.sub}</p></div>
    <Icon name="chevron" size={18} className="arrow" />
  </button>
);

// ───────── 콘서트·뮤지컬 ─────────
function ShowPicker({ category, onPick }: { category: 'concert' | 'musical'; onPick: (t: Target) => void }) {
  const [snap, setSnap] = useState<Snapshot<EventItem> | null>(null);
  const [tab, setTab] = useState<'event' | 'venue'>('venue');
  const [month, setMonth] = useState(0);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(40);
  const [pending, setPending] = useState<{ event: EventItem; candidates: Venue[] } | null>(null);
  const { known, templates } = venuesFor(category);

  useEffect(() => {
    loadSnapshot<EventItem>(`events-${category}.json`).then((s) => {
      setSnap(s);
      if (s.items.length) setTab('event');
    });
  }, [category]);

  const months = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map((m) => {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + m + 1, 0);
      const f = (x: Date) => `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, '0')}.${String(x.getDate()).padStart(2, '0')}`;
      return { id: String(m), label: ['이번 달', '다음 달', '다다음 달'][m] + ` (${d.getMonth() + 1}월)`, from: f(d), to: f(end) };
    });
  }, []);

  const events = useMemo(() => {
    const m = months[month];
    const kw = q.trim().toLowerCase();
    // 그 달에 시작하는 공연을 먼저, 이전부터 이어지는 장기 공연은 뒤로
    const startsIn = (e: EventItem) => (e.from >= m.from ? 0 : 1);
    return (snap?.items ?? [])
      .filter((e) => e.from <= m.to && e.to >= m.from && (!kw || e.name.toLowerCase().includes(kw) || e.venue.toLowerCase().includes(kw)))
      .sort((a, b) => startsIn(a) - startsIn(b) || a.from.localeCompare(b.from));
  }, [snap, month, months, q]);

  const choose = (e: EventItem) => {
    const { venues, exact } = matchVenues(e.venue);
    if (exact) onPick({ venue: venues[0], title: e.name, state: e.state });
    else setPending({ event: e, candidates: venues });
  };

  if (pending) {
    const { event: ev, candidates } = pending;
    const pick = (venue: Venue) => onPick({ venue, title: ev.name, state: ev.state });
    return (
      <>
        <h1 className="page-title">{ev.name}</h1>
        <p className="page-sub">{ev.venue}</p>
        {candidates.length > 0 ? (
          <>
            <div className="notice plain">이 시설에는 공연장이 여러 곳이에요. 예매처에 적힌 홀을 골라 주세요.</div>
            <div className="list">{candidates.map((v) => <VenueRow key={v.id} v={v} onClick={() => pick(v)} />)}</div>
            <h2 className="section-h">목록에 없는 홀이라면 — 비슷한 유형으로</h2>
          </>
        ) : (
          <div className="notice">이 공연장은 아직 좌석 데이터가 없어요. 가장 비슷한 유형을 고르면 그 구조를 기준으로 추천해 드려요.</div>
        )}
        <div className="list">
          {templates.map((v) => <VenueRow key={v.id} v={v} onClick={() => pick({ ...v, name: ev.venue, sub: `${v.name} 기준 추천` })} />)}
        </div>
        <p style={{ marginTop: 16 }}><button type="button" className="link-btn" onClick={() => setPending(null)}><Icon name="back" size={16} />다른 공연 고르기</button></p>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">어떤 {category === 'concert' ? '콘서트' : '뮤지컬'}인가요</h1>
      <p className="page-sub">공연을 고르면 공연장 구조에 맞춰 추천해요.</p>
      <Seg options={[{ id: 'event', label: '공연으로 찾기' }, { id: 'venue', label: '공연장으로 찾기' }]} value={tab} onChange={setTab} />

      {tab === 'event' && (
        snap && !snap.items.length ? (
          <div className="notice plain">
            공연 목록이 아직 연결되지 않았어요. KOPIS 공연예술통합전산망 API 키를 설정하면 이번 달부터 다다음 달까지의 공연이 매일 갱신돼요.
            지금은 <b>공연장으로 찾기</b>를 이용해 주세요.
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14 }}><Chips options={months} value={String(month)} onChange={(v) => { setMonth(Number(v)); setLimit(40); }} /></div>
            <input className="text-input" style={{ marginTop: 10 }} placeholder="공연명·공연장 검색" value={q} onChange={(e) => setQ(e.target.value)} aria-label="공연 검색" />
            <div className="list">
              {events.slice(0, limit).map((e) => (
                <button key={e.id} type="button" className="row" onClick={() => choose(e)}>
                  <div className="grow"><h3>{e.name}</h3><p>{e.from} ~ {e.to} · {e.venue}</p></div>
                  <span className={`badge${e.state === '공연예정' ? ' accent' : ''}`}>{e.state}</span>
                </button>
              ))}
              {snap && !events.length && <p className="empty">조건에 맞는 공연이 없어요.</p>}
              {events.length > limit && <button type="button" className="btn ghost" onClick={() => setLimit(limit + 40)}>더 보기 ({events.length - limit}건)</button>}
            </div>
            {snap?.updatedAt && <p className="foot" style={{ marginTop: 14 }}>출처: (재)예술경영지원센터 공연예술통합전산망(KOPIS) · {new Date(snap.updatedAt).toLocaleDateString('ko-KR')} 갱신</p>}
          </>
        )
      )}

      {tab === 'venue' && (
        <>
          <div className="list">{known.map((v) => <VenueRow key={v.id} v={v} onClick={() => onPick({ venue: v })} />)}</div>
          <h2 className="section-h">목록에 없다면 — 비슷한 유형으로</h2>
          <div className="list">{templates.map((v) => <VenueRow key={v.id} v={v} onClick={() => onPick({ venue: v })} />)}</div>
        </>
      )}
    </>
  );
}

// ───────── 영화 ─────────
function MoviePicker({ onPick }: { onPick: (t: Target) => void }) {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [movie, setMovie] = useState('');
  const [hall, setHall] = useState<HallType>('standard');
  const [rows, setRows] = useState(11);
  const [cols, setCols] = useState(16);
  const [ai, setAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSnapshot<MovieItem>('movies.json').then((s) => setMovies(s.items));
    fetchAiEnabled().then(setAi);
  }, []);

  const pickHall = (id: HallType) => {
    const h = HALLS.find((x) => x.id === id)!;
    setHall(id);
    setRows(h.rows);
    setCols(h.cols);
  };

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const img = await shrinkImage(file);
      const { rows: parsed } = await postJson<{ rows: { label: string; cells: string }[] }>('/api/parse-seatmap', img);
      const venue = makeCinema({ hall, rows: 0, cols: 0, name: '캡처한 상영관', cells: parsed.map((r) => r.cells.replace(/[ox]/g, 's')), rowLabels: parsed.map((r) => r.label) });
      const initialSold: string[] = [];
      parsed.forEach((r, ri) => [...r.cells].forEach((ch, ci) => { if (ch === 'x') initialSold.push(`0-${ri}-${ci}`); }));
      onPick({ venue, title: movie || undefined, initialSold });
    } catch (e) {
      setError(e instanceof Error ? e.message : '인식에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="page-title">어떤 상영관인가요</h1>
      <p className="page-sub">상영관 타입과 크기에 따라 좋은 자리가 달라져요.</p>

      {movies.length > 0 && (
        <section className="card">
          <h2 className="card-title">현재 상영작 <small style={{ fontWeight: 400 }}>· 선택</small></h2>
          <div className="chips">
            {movies.map((m) => (
              <button key={m.name} type="button" className={`chip${movie === m.name ? ' on' : ''}`} onClick={() => setMovie(movie === m.name ? '' : m.name)}>
                {m.rank}. {m.name}
              </button>
            ))}
          </div>
          <p className="foot" style={{ marginTop: 12 }}>출처: 영화진흥위원회 영화관입장권통합전산망(KOBIS) 일별 박스오피스</p>
        </section>
      )}

      <section className="card">
        <h2 className="card-title">상영관 타입</h2>
        <Chips tall options={HALLS.map((h) => ({ id: h.id, label: h.name, hint: h.desc }))} value={hall} onChange={pickHall} />
      </section>

      <section className="card">
        <h2 className="card-title">상영관 크기</h2>
        <div className="chips">
          {CINEMA_SIZES.map((s) => (
            <button key={s.id} type="button" className={`chip tall${rows === s.rows && cols === s.cols ? ' on' : ''}`} onClick={() => { setRows(s.rows); setCols(s.cols); }}>
              {s.name}<small>{s.hint}</small>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <Field label="행 수" hint="예매 화면의 A~? 열 개수"><Stepper value={rows} min={4} max={26} unit="행" onChange={setRows} /></Field>
          <Field label="한 행의 좌석 수" hint="가장 긴 행 기준"><Stepper value={cols} min={4} max={44} unit="석" onChange={setCols} /></Field>
        </div>
        <p className="seg-desc">예매 화면에 보이는 행·좌석 수와 맞추면 추천 번호가 더 정확해져요.</p>
      </section>

      {ai && (
        <section className="card">
          <h2 className="card-title">예매 화면 캡처로 불러오기 <span className="badge accent">베타</span></h2>
          <p className="seg-desc" style={{ margin: '0 0 12px' }}>좌석 선택 화면을 캡처해 올리면 실제 배치와 남은 자리를 인식해 그 안에서 추천해요.</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button type="button" className="btn ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <><span className="spinner" /> 좌석을 읽는 중…</> : '캡처 이미지 올리기'}
          </button>
          {error && <div className="notice" role="alert">{error}</div>}
        </section>
      )}

      <h2 className="section-h">대표 특별관 바로 고르기</h2>
      <div className="list">
        {CINEMA_PRESETS.map((p) => (
          <button key={p.id} type="button" className="row" onClick={() => onPick({ venue: makeCinema({ hall: p.hall, rows: p.rows, cols: p.cols, name: p.name, sub: p.sub }), title: movie || undefined })}>
            <div className="grow"><h3>{p.name}</h3><p>{p.sub}</p></div><Icon name="chevron" size={18} className="arrow" />
          </button>
        ))}
      </div>

      <div className="sticky-cta">
        <button type="button" className="btn" onClick={() => onPick({ venue: makeCinema({ hall, rows, cols }), title: movie || undefined })}>이 상영관으로 추천받기</button>
      </div>
    </>
  );
}

// ───────── 스포츠 ─────────
function SportsPicker({ onPick }: { onPick: (t: Target) => void }) {
  const [sport, setSport] = useState<Sport>('baseball');
  return (
    <>
      <h1 className="page-title">어느 경기장에 가나요</h1>
      <p className="page-sub">종목을 고르고 방문할 프로 경기장을 선택하세요.</p>
      <Seg options={SPORTS.map((s) => ({ id: s.id, label: <><Icon name={s.id} size={17} />{s.name}</> }))} value={sport} onChange={setSport} />
      <div className="list">
        {STADIUMS[sport].map((v) => <VenueRow key={v.id} v={v} onClick={() => onPick({ venue: v })} />)}
      </div>
      <p className="foot" style={{ marginTop: 16 }}>{DATA_AS_OF} 기준. 홈구장과 응원석 방향은 시즌마다 달라질 수 있어요.</p>
    </>
  );
}

export default function TargetPicker({ category, onPick }: { category: Category; onPick: (t: Target) => void }) {
  const picker = category === 'movie' ? <MoviePicker onPick={onPick} />
    : category === 'sports' ? <SportsPicker onPick={onPick} />
      : <ShowPicker category={category} onPick={onPick} />;
  // 영화 화면은 아래에 고정 버튼이 있어 광고를 두지 않는다
  return <>{picker}{category !== 'movie' && <AdSlot slot="list" />}</>;
}
