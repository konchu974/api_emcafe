// src/routes/sendcloudRoutes.ts
import express, { Request, Response } from 'express';
const router = express.Router();

const BASE = 'https://servicepoints.sendcloud.sc/api/v2';

// Helper pour Basic Auth header
function getAuthHeader() {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY || '';
  const secretKey = process.env.SENDCLOUD_SECRET_KEY || '';
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

router.get('/service-points', async (req: Request, res: Response) => {
  try {
    const country = (req.query.country as string) || 'FR';
    const city = (req.query.city as string) || '';
    const postal_code = (req.query.postal_code as string) || (req.query.cp as string);

    if (!postal_code && !city) {
      return res.status(400).json({ error: 'postal_code or city query param required' });
    }

    const url = `${BASE}/service-points?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}&postal_code=${encodeURIComponent(postal_code)}`;

    const resp = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
        'X-Requested-With': '',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Sendcloud service-points error', resp.status, text);
      return res.status(502).json({ error: 'Failed to fetch from Sendcloud', status: resp.status, body: text });
    }

    const data = (await resp.json()) as any[];
    const mapped = data.map((p: any) => ({
      id: p.id,
      name: p.name || `${p.postal_code} ${p.city}`,
      address: p.address || '',
      postal_code: p.postal_code || '',
      city: p.city || '',
      carrier: p.carrier || null,
      raw: p,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Error /service-points', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
