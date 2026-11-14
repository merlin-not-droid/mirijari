'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Snapshot } from './types.ts';

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
/** GitHub Pages 같은 정적 호스팅이면 서버 API(AI 기능)가 없다 */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC === '1';

export async function loadSnapshot<T>(name: string): Promise<Snapshot<T>> {
  try {
    const res = await fetch(`${BASE}/data/${name}`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return { source: 'none', updatedAt: null, items: [] };
  }
}

export async function fetchAiEnabled(): Promise<boolean> {
  if (IS_STATIC) return false;
  try {
    const res = await fetch(`${BASE}/api/ai-status`);
    return res.ok && (await res.json()).enabled === true;
  } catch {
    return false;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? '요청에 실패했어요.');
  return json as T;
}

/** localStorage에 저장되는 상태. loaded 전에는 초기값, saved는 저장된 값이 있었는지 */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [state, setState] = useState({ loaded: false, saved: false });
  useEffect(() => {
    let saved = false;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setValue({ ...initial, ...JSON.parse(raw) });
        saved = true;
      }
    } catch { /* 저장소를 쓸 수 없으면 초기값으로 */ }
    setState({ loaded: true, saved });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((next: T) => {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* 무시 */ }
  }, [key]);
  return [value, set, state] as const;
}

/** 업로드 이미지를 긴 변 1568px 이하 JPEG로 줄여 base64로 돌려준다 */
export async function shrinkImage(file: File): Promise<{ mediaType: 'image/jpeg'; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { mediaType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.88).split(',')[1] };
}
