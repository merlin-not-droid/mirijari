import { z } from 'zod';
import { aiEnabled, aiErrorResponse, anthropic, MODEL, rateLimited } from '@/lib/server/ai';

const Body = z.object({
  category: z.string().max(20),
  venue: z.string().max(80),
  mode: z.string().max(20),
  profile: z.string().max(600),
  picks: z.array(z.object({
    title: z.string().max(40),
    label: z.string().max(80),
    score: z.number(),
    reasons: z.array(z.string().max(200)).max(4),
    tradeoff: z.string().max(200).optional(),
    advice: z.string().max(400).optional(),
  })).min(1).max(3),
  question: z.string().max(200).optional(),
});

const SYSTEM = `당신은 좌석 추천 서비스 '미리자리'의 좌석 컨시어지입니다.
추천 엔진이 이미 관객의 키·취향·동행 정보를 바탕으로 좌석 후보와 근거를 계산해 두었습니다. 당신의 역할은 그 결과를 이 관객 한 사람에게 말하듯 풀어 주는 것입니다.

- 엔진이 준 후보와 근거가 사실의 전부입니다. 공연장에 대해 주어지지 않은 사실(실제 좌석 번호의 시야, 가격, 시설 위치 등)을 지어내지 마세요.
- 1순위가 왜 이 사람에게 맞는지 먼저 말하고, 어떤 경우에 2·3순위가 더 나은 선택인지 짚어 주세요.
- 관객이 고민을 적었다면 그 질문에 먼저, 분명하게 답하세요. 엔진 결과로 답할 수 없는 질문이면 그렇다고 말하세요.
- 친근한 존댓말(해요체) 한국어, 4~6문장, 머리말·목록·마크다운 없이 한 문단으로 쓰세요.`;

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: 'AI 기능이 꺼져 있어요.' }, { status: 503 });
  if (rateLimited(req)) return Response.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: '요청 형식이 올바르지 않아요.' }, { status: 400 });
  const b = parsed.data;

  const user = [
    `카테고리: ${b.category} / 장소: ${b.venue} / 상황: ${b.mode}`,
    `관객: ${b.profile}`,
    '엔진 추천 결과:',
    ...b.picks.map((p, i) =>
      `${i + 1}. [${p.title}] ${p.label} (적합도 ${p.score}점)\n   근거: ${p.reasons.join(' / ')}${p.tradeoff ? `\n   아쉬운 점: ${p.tradeoff}` : ''}${p.advice ? `\n   자리 조언: ${p.advice}` : ''}`),
    b.question ? `관객의 고민: ${b.question}` : '',
  ].filter(Boolean).join('\n');

  try {
    // 정책상 거절이 나면 서버가 대체 모델로 같은 요청을 이어서 처리하도록 fallbacks를 켜 둔다
    const res = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    });
    if (res.stop_reason === 'refusal') return Response.json({ error: '이 요청에는 코멘트를 드릴 수 없어요.' }, { status: 422 });
    const text = res.content.flatMap((c) => (c.type === 'text' ? [c.text] : [])).join('').trim();
    return Response.json({ text });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
