'use client';
import type { Category, CategoryPrefs, Profile } from '@/lib/types';
import {
  AGE, BUDGET, COMPANION, EXPERIENCE, EXPERIENCE_LABEL, FLAGS, GENDER, HAND, ROW_PREF, SIDE_PREF, STYLES, VISION,
} from '@/lib/options';
import { Chips, Field, MultiChips, Stepper } from './ui';

interface Props {
  category: Category;
  profile: Profile;
  prefs: CategoryPrefs;
  onProfile: (p: Profile) => void;
  onPrefs: (p: CategoryPrefs) => void;
  onDone: () => void;
}

export default function ProfileForm({ category, profile, prefs, onProfile, onPrefs, onDone }: Props) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onProfile({ ...profile, [k]: v });
  const flags = FLAGS.filter((f) => f.id !== 'sun' || category === 'sports' || category === 'concert');

  return (
    <>
      <h1 className="page-title">1분이면 돼요</h1>
      <p className="page-sub">추천에 쓰이는 정보만 물어봐요. 이 기기에만 저장되고, 다음엔 건너뛸 수 있어요.</p>

      <section className="card">
        <h2 className="card-title">나</h2>
        <Field label="키" hint="눈높이와 앞사람 가림 계산에 써요">
          <div className="range-row">
            <output>{profile.height}<small>cm</small></output>
            <input type="range" min={140} max={200} step={1} value={profile.height} aria-label="키"
              onChange={(e) => set('height', Number(e.target.value))} />
          </div>
        </Field>
        <Field label="나이대"><Chips options={AGE} value={profile.ageBand} onChange={(v) => set('ageBand', v)} /></Field>
        <Field label="시력"><Chips options={VISION} value={profile.vision} onChange={(v) => set('vision', v)} /></Field>
        <Field label="성별" hint="선택"><Chips options={GENDER} value={profile.gender} onChange={(v) => set('gender', v)} /></Field>
        <Field label="주로 쓰는 손" hint="선택 · 좌우 위치에 아주 조금 반영"><Chips options={HAND} value={profile.hand} onChange={(v) => set('hand', v)} /></Field>
      </section>

      <section className="card">
        <h2 className="card-title">이번 관람</h2>
        <Field label={EXPERIENCE_LABEL[category]}>
          <Chips options={EXPERIENCE} value={prefs.experience} onChange={(v) => onPrefs({ ...prefs, experience: v })} />
        </Field>
        <Field label="몇 명이 가나요" hint="붙어 있는 자리로 찾아요">
          <Stepper value={profile.partySize} min={1} max={6} unit="명" onChange={(n) => onProfile({ ...profile, partySize: n, companion: n === 1 ? 'solo' : profile.companion === 'solo' ? 'friends' : profile.companion })} />
        </Field>
        {profile.partySize > 1 && (
          <Field label="누구와 가나요">
            <Chips options={COMPANION.filter((c) => c.id !== 'solo')} value={profile.companion} onChange={(v) => set('companion', v)} />
          </Field>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">취향</h2>
        <Field label="무엇이 가장 중요한가요">
          <Chips tall options={STYLES[category]} value={prefs.style} onChange={(v) => onPrefs({ ...prefs, style: v })} />
        </Field>
        <Field label="선호하는 앞뒤 위치"><Chips options={ROW_PREF} value={profile.rowPref} onChange={(v) => set('rowPref', v)} /></Field>
        <Field label="선호하는 좌우 위치"><Chips options={SIDE_PREF} value={profile.sidePref} onChange={(v) => set('sidePref', v)} /></Field>
        {category !== 'movie' && (
          <Field label="예산"><Chips options={BUDGET} value={profile.budget} onChange={(v) => set('budget', v)} /></Field>
        )}
        <Field label="해당하는 게 있다면" hint="여러 개 선택">
          <MultiChips options={flags} value={profile.flags} onChange={(v) => set('flags', v)} />
        </Field>
      </section>

      <div className="sticky-cta"><button type="button" className="btn" onClick={onDone}>다음</button></div>
    </>
  );
}
