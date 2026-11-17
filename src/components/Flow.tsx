'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Category, CategoryPrefs, Persona, Profile } from '@/lib/types';
import { BRAND, COMPANION, DEFAULT_PROFILE, STYLES, defaultPrefs, labelOf } from '@/lib/options';
import { useStored } from '@/lib/client';
import Icon, { Logo } from './Icon';
import ProfileForm from './ProfileForm';
import TargetPicker, { type Target } from './TargetPicker';
import Result from './Result';

type Step = 'profile' | 'target' | 'result';
const ORDER: Step[] = ['profile', 'target', 'result'];

export default function Flow({ category }: { category: Category }) {
  const [profile, setProfile, pState] = useStored<Profile>('miri.profile', DEFAULT_PROFILE);
  const [prefs, setPrefs, cState] = useStored<CategoryPrefs>(`miri.prefs.${category}`, defaultPrefs(category));
  const [step, setStep] = useState<Step>('profile');
  const [target, setTarget] = useState<Target | null>(null);
  const ready = pState.loaded && cState.loaded;

  // 이전에 답한 적이 있으면 설문을 건너뛴다
  useEffect(() => {
    if (ready && pState.saved && cState.saved) setStep('target');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const persona: Persona = useMemo(() => ({ ...profile, ...prefs, category }), [profile, prefs, category]);
  const back = () => setStep(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);

  return (
    <>
      <header className="top">
        <Link href="/" className="logo"><Logo name={BRAND.name} /></Link>
        {step === 'profile' ? <Link href="/" className="top-link">처음으로</Link> : <button type="button" className="top-link" onClick={back}><Icon name="back" size={16} />이전</button>}
      </header>
      <div className="steps" aria-label={`${ORDER.indexOf(step) + 1} / 3 단계`}>
        {ORDER.map((s, i) => <span key={s} className={i <= ORDER.indexOf(step) ? 'on' : ''} />)}
      </div>

      {!ready ? null : step === 'profile' ? (
        <ProfileForm category={category} profile={profile} prefs={prefs} onProfile={setProfile} onPrefs={setPrefs}
          onDone={() => { setProfile(profile); setPrefs(prefs); setStep(target ? 'result' : 'target'); }} />
      ) : (
        <>
          <div className="summary">
            <span>
              <Icon name={category} size={17} /><b>{profile.height}cm</b> · {profile.partySize}명{profile.partySize > 1 ? `(${labelOf(COMPANION, profile.companion)})` : ''} · <b>{labelOf(STYLES[category], prefs.style)}</b>
            </span>
            <button type="button" className="link-btn" onClick={() => setStep('profile')}>내 정보 수정</button>
          </div>
          <div style={{ marginTop: 22 }}>
            {step === 'target' || !target
              ? <TargetPicker category={category} onPick={(t) => { setTarget(t); setStep('result'); }} />
              : <Result key={target.venue.id + (target.title ?? '')} target={target} persona={persona} />}
          </div>
        </>
      )}
    </>
  );
}
