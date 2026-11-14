import Anthropic from '@anthropic-ai/sdk';

export const aiEnabled = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
export const MODEL = process.env.ANTHROPIC_MODEL?.trim() || 'claude-opus-5-5';

let client: Anthropic | null = null;
export const anthropic = () => (client ??= new Anthropic());

/** 서버 인스턴스 단위의 간단한 요청 제한. 운영 단계에서는 Upstash 등 외부 저장소 기반으로 교체 */
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimited(req: Request, limit = 12, windowMs = 60_000) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + windowMs });
    return false;
  }
  return ++h.n > limit;
}

export function aiErrorResponse(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: 'AI 키 설정을 확인해 주세요.' }, { status: 500 });
  if (error instanceof Anthropic.RateLimitError) return Response.json({ error: '요청이 몰리고 있어요. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
  if (error instanceof Anthropic.APIError) return Response.json({ error: `AI 응답 오류 (${error.status ?? '연결'})` }, { status: 502 });
  console.error(error);
  return Response.json({ error: '알 수 없는 오류가 발생했어요.' }, { status: 500 });
}
