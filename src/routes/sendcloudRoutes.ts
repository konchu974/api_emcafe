import express, { Request, Response } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { createParcel } from '../services/sendcloudService';

const router = express.Router();

const BASE_SERVICE_POINTS = 'https://servicepoints.sendcloud.sc/api/v2';

// Helper Basic Auth pour service-points (REST API)
function getAuthHeader() {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY || '';
  const secretKey = process.env.SENDCLOUD_SECRET_KEY || '';
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * GET /api/sendcloud/service-points
 */
router.get('/service-points', async (req: Request, res: Response) => {
  try {
    const country = (req.query.country as string) || 'FR';
    const city = (req.query.city as string) || '';
    const postal_code = (req.query.postal_code as string) || (req.query.cp as string);
    const carrier = req.query.carrier as string;

    if (!postal_code && !city) {
      return res.status(400).json({ error: 'postal_code or city query param required' });
    }

    let url = `${BASE_SERVICE_POINTS}/service-points?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}&postal_code=${encodeURIComponent(postal_code)}`;
    if (carrier) url += `&carrier=${encodeURIComponent(carrier)}`;

    const resp = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
        'X-Requested-With': '',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ error: 'Failed to fetch from Sendcloud', status: resp.status, body: text });
    }

    const data = await resp.json();
    const mapped = data.map((p: any) => ({
      id: p.id,
      name: p.name || `${p.postal_code} ${p.city}`,
      address: p.address || '',
      postal_code: p.postal_code || '',
      city: p.city || '',
      country: p.country || '',
      carrier: p.carrier || null,
      opening_hours: p.opening_hours || null,
      latitude: p.latitude || null,
      longitude: p.longitude || null,
      raw: p,
    }));

    return res.json(mapped);

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sendcloud/parcels
 * Utilise le service createParcel
 */
router.post('/parcels', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Validation minimale
    if (!payload.name || !payload.address || !payload.city || !payload.postal_code || !payload.country) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    const parcel = await createParcel(payload);

    return res.json({
      id: parcel.id,
      tracking_number: parcel.tracking_number,
      tracking_url: parcel.tracking_url,
      status: parcel.status,
      carrier: parcel.carrier,
      label: {
        label_printer: parcel.label?.label_printer || null,
        normal_printer: parcel.label?.normal_printer || null,
      },
      created_at: parcel.created_at,
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/sendcloud/shipping-methods
 * Liste les méthodes d'expédition disponibles
 */
router.get('/shipping-methods', authMiddleware, async (req: Request, res: Response) => {
  try {
    const apiBase = 'https://panel.sendcloud.sc/api/v2';
    const resp = await fetch(`${apiBase}/shipping-methods`, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'Failed to fetch shipping methods', body: text });
    }

    const result = await resp.json();
    return res.json(result.shipping_methods || []);

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
