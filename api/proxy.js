export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    // ── 비밀번호 검증 요청 ──────────────────────────────────────
    if (body.action === 'verify') {
      if (body.password === process.env.ACCESS_TOKEN) {
        return res.status(200).json({ ok: true });
      } else {
        return res.status(401).json({ ok: false, error: '접근 권한이 없습니다.' });
      }
    }

    // ── 일반 Claude API 요청: 비밀번호 확인 ────────────────────
    const { accessToken, ...cleanBody } = body;
    if (!accessToken || accessToken !== process.env.ACCESS_TOKEN) {
      return res.status(401).json({ error: '접근 권한이 없습니다.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(cleanBody)
    });

    const text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);

  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
