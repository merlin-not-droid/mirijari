import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { aiEnabled, aiErrorResponse, anthropic, MODEL, rateLimited } from '@/lib/server/ai';

const Body = z.object({
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().min(100).max(4_000_000),
});

const SeatMap = z.object({
  readable: z.boolean().describe('좌석 배치도를 읽을 수 있으면 true'),
  rows: z.array(z.object({
    label: z.string().describe('행 이름. 예: A, B, 1, 2'),
    cells: z.string().describe("왼쪽부터 칸마다 한 글자. o = 선택 가능, x = 판매됨/선택 불가, _ = 통로나 빈 공간"),
  })).describe('스크린(무대)에 가까운 행부터'),
});

const PROMPT = `영화관 예매 화면의 좌석 배치도 캡처입니다. 좌석 격자를 그대로 옮겨 주세요.

- 스크린에 가까운 행부터 순서대로, 각 행을 왼쪽에서 오른쪽으로 읽습니다.
- 칸마다 한 글자: 선택 가능한 좌석은 o, 이미 판매됐거나 선택할 수 없는 좌석(장애인석·띄어앉기 포함)은 x, 통로나 좌석이 없는 빈 공간은 _ 입니다.
- 모든 행의 문자열 길이가 같도록, 좌석이 없는 칸은 _ 로 채워 세로 열이 실제 화면과 맞게 정렬해 주세요.
- 색상 범례가 보이면 그 범례를 기준으로 판매 여부를 판단합니다.
- 좌석 배치도가 아니거나 흐려서 읽을 수 없으면 readable을 false로 하고 rows는 비워 주세요. 추측으로 채우지 마세요.`;

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: 'AI 기능이 꺼져 있어요.' }, { status: 503 });
  if (rateLimited(req, 5)) return Response.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: '이미지를 읽을 수 없어요.' }, { status: 400 });

  try {
    const res = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium', format: zodOutputFormat(SeatMap) },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: parsed.data.mediaType, data: parsed.data.data } },
          { type: 'text', text: PROMPT },
        ],
      }],
    });
    const out = res.parsed_output;
    if (res.stop_reason === 'refusal' || !out?.readable || out.rows.length < 3)
      return Response.json({ error: '좌석 배치도를 인식하지 못했어요. 좌석 영역만 크게 캡처해 다시 올려 주세요.' }, { status: 422 });
    const width = Math.max(...out.rows.map((r) => r.cells.length));
    const rows = out.rows
      .map((r) => ({ label: r.label.slice(0, 3), cells: r.cells.toLowerCase().replace(/[^ox_]/g, '_').padEnd(width, '_') }))
      .filter((r) => /[ox]/.test(r.cells));
    return Response.json({ rows });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
