// src/routes/sendcloudRoutes.ts
import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createParcel,
  getParcel,
  cancelParcel,
  getParcelLabel
} from '../services/sendcloudService';

const router = express.Router();

/* ======================================================
   CONFIG
====================================================== */
const BASE_SERVICE_POINTS = 'https://servicepoints.sendcloud.sc/api/v2';

/**
 * Basic Auth pour Service Points API
 */
function getAuthHeader(): string {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY;
  const secretKey = process.env.SENDCLOUD_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error('SENDCLOUD_PUBLIC_KEY et SENDCLOUD_SECRET_KEY requis');
  }

  return (
    'Basic ' +
    Buffer.from(`${publicKey}:${secretKey}`).toString('base64')
  );
}

/* ======================================================
   🗺️  POINTS RELAIS
====================================================== */

/**
 * GET /api/sendcloud/service-points
 */
router.get('/service-points', async (req: Request, res: Response) => {
  try {
    const country = (req.query.country as string) || 'FR';
    const city = (req.query.city as string) || '';
    const postal_code =
      (req.query.postal_code as string) ||
      (req.query.cp as string) ||
      '';
    const carrier = req.query.carrier as string | undefined;

    if (!postal_code && !city) {
      return res.status(400).json({
        success: false,
        error: 'postal_code ou city requis'
      });
    }

    let url = `${BASE_SERVICE_POINTS}/service-points?country=${country}`;
    if (city) url += `&city=${encodeURIComponent(city)}`;
    if (postal_code) url += `&postal_code=${postal_code}`;
    if (carrier) url += `&carrier=${carrier}`;

    const response = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: await response.text()
      });
    }

    const data: any[] = await response.json();

    const mapped = data.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.street,
      postal_code: p.postal_code,
      city: p.city,
      country: p.country,
      carrier: p.carrier,
      opening_hours: p.opening_hours,
      latitude: p.latitude,
      longitude: p.longitude
    }));

    res.json({
      success: true,
      count: mapped.length,
      data: mapped
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ======================================================
   📦 CRÉATION COLIS
====================================================== */

/**
 * POST /api/sendcloud/parcels
 */
router.post('/parcels', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const required = ['name', 'address', 'city', 'postal_code', 'country', 'weight'];
    const missing = required.filter((f) => !payload[f]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Champs manquants',
        missing
      });
    }

    if (!payload.email && !payload.telephone) {
      return res.status(400).json({
        success: false,
        error: 'email ou telephone requis'
      });
    }

    const parcel = await createParcel(payload);

    res.status(201).json({
      success: true,
      data: {
        id: parcel.id,
        order_number: parcel.order_number,
        tracking_number: parcel.tracking_number,
        tracking_url: parcel.tracking_url,
        status: parcel.status?.message,
        label: {
          a6: parcel.label?.label_printer ?? null,
          a4: parcel.label?.normal_printer?.[0] ?? null
        },
        created_at: parcel.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ======================================================
   📦 GET COLIS
====================================================== */

router.get('/parcels/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const parcel = await getParcel(id);
    res.json({ success: true, data: parcel });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ======================================================
   🏷️ ÉTIQUETTE
====================================================== */

router.get('/parcels/:id/label', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const format = (req.query.format as 'A4' | 'A6') || 'A4';

    const url = await getParcelLabel(id, format);

    if (!url) {
      return res.status(404).json({
        success: false,
        error: 'Étiquette non disponible'
      });
    }

    res.json({
      success: true,
      data: { label_url: url, format }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ======================================================
   🗑️ ANNULATION
====================================================== */

router.post('/parcels/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await cancelParcel(id);

    res.json({
      success: true,
      message: 'Colis annulé',
      data: result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

// GET /api/sendcloud/shipping-methods
router.get('/shipping-methods', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://panel.sendcloud.sc/api/v2/shipping-methods', {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: await response.text(),
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

