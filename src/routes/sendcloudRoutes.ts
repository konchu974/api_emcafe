// src/routes/sendcloudRoutes.ts
import express, { Request, Response } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { 
  createParcel, 
  getParcel, 
  getShippingMethods,
  cancelParcel,
  getParcelLabel
} from '../services/sendcloudService';

const router = express.Router();

const BASE_SERVICE_POINTS = 'https://servicepoints.sendcloud.sc/api/v2';

/**
 * Helper Basic Auth pour service-points (REST API)
 */
function getAuthHeader(): string {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY || '';
  const secretKey = process.env.SENDCLOUD_SECRET_KEY || '';
  
  if (!publicKey || !secretKey) {
    throw new Error('SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY must be set');
  }
  
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

// ========================================
// 🗺️  POINTS RELAIS
// ========================================

/**
 * GET /api/sendcloud/service-points
 * Rechercher des points relais
 */
router.get('/service-points', async (req: Request, res: Response) => {
  try {
    const country = (req.query.country as string) || 'FR';
    const city = (req.query.city as string) || '';
    const postal_code = (req.query.postal_code as string) || (req.query.cp as string) || '';
    const carrier = req.query.carrier as string;

    // Validation
    if (!postal_code && !city) {
      return res.status(400).json({ 
        success: false,
        error: 'postal_code or city query param required' 
      });
    }

    // Construction URL
    let url = `${BASE_SERVICE_POINTS}/service-points?country=${encodeURIComponent(country)}`;
    if (city) url += `&city=${encodeURIComponent(city)}`;
    if (postal_code) url += `&postal_code=${encodeURIComponent(postal_code)}`;
    if (carrier) url += `&carrier=${encodeURIComponent(carrier)}`;

    console.log('🗺️  Recherche points relais:', { country, city, postal_code, carrier });

    const resp = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
        'X-Requested-With': '',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('❌ Erreur API SendCloud Service Points:', text);
      return res.status(502).json({ 
        success: false,
        error: 'Failed to fetch from SendCloud', 
        status: resp.status, 
        details: text 
      });
    }

    const data: any[] = await resp.json();

    // Mapping des données
    const mapped = data.map((p: any) => ({
      id: p.id,
      name: p.name || `${p.postal_code} ${p.city}`,
      address: p.street || p.address || '',
      address_2: p.house_number || '',
      postal_code: p.postal_code || '',
      city: p.city || '',
      country: p.country || '',
      carrier: p.carrier || null,
      opening_hours: p.opening_hours || null,
      latitude: p.latitude || null,
      longitude: p.longitude || null,
      distance: p.distance || null,
      formatted_opening_times: p.formatted_opening_times || null,
    }));

    console.log(`✅ ${mapped.length} point(s) relais trouvé(s)`);

    return res.json({
      success: true,
      count: mapped.length,
      data: mapped,
    });

  } catch (err: any) {
    console.error('❌ Erreur service-points:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: err.message 
    });
  }
});

// ========================================
// 📦 GESTION DES COLIS
// ========================================

/**
 * POST /api/sendcloud/parcels
 * Créer un nouveau colis
 */
router.post('/parcels', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('📦 Création d\'un colis...');
    console.log('📋 Body reçu:', JSON.stringify(req.body, null, 2));

    const payload = req.body;

    // Validation minimale
    const requiredFields = ['name', 'address', 'city', 'postal_code', 'country'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        missing: missingFields
      });
    }

    // Validation email/telephone (au moins un requis)
    if (!payload.email && !payload.telephone) {
      return res.status(400).json({
        success: false,
        error: 'Either email or telephone is required'
      });
    }

    // Créer le colis via le service
    const parcel = await createParcel(payload);

    console.log('✅ Colis créé avec succès:', parcel.id);

    return res.status(201).json({
      success: true,
      data: {
        id: parcel.id,
        tracking_number: parcel.tracking_number || null,
        tracking_url: parcel.tracking_url || null,
        status: {
          id: parcel.status?.id || null,
          message: parcel.status?.message || 'Unknown',
        },
        carrier: parcel.carrier ? {
          code: parcel.carrier.code || null,
          name: parcel.carrier.name || null,
        } : null,
        label: {
          label_printer: parcel.label?.label_printer || null,
          normal_printer: parcel.label?.normal_printer?.[0] || null,
        },
        order_number: parcel.order_number,
        to_name: parcel.name,
        to_address: parcel.address,
        to_city: parcel.city,
        to_postal_code: parcel.postal_code,
        to_country: parcel.country,
        weight: parcel.weight,
        created_at: parcel.created_at,
      },
    });

  } catch (err: any) {
    console.error('❌ Erreur création colis:', err.message);
    return res.status(500).json({ 
      success: false,
      error: err.message || 'Internal server error' 
    });
  }
});

/**
 * GET /api/sendcloud/parcels/:id
 * Récupérer les détails d'un colis
 */
router.get('/parcels/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parcelId = parseInt(req.params.id, 10);
    
    if (isNaN(parcelId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid parcel ID' 
      });
    }

    console.log(`📦 Récupération du colis ${parcelId}...`);

    const parcel = await getParcel(parcelId);

    return res.json({
      success: true,
      data: parcel,
    });

  } catch (err: any) {
    console.error('❌ Erreur récupération colis:', err.message);
    
    if (err.message.includes('404')) {
      return res.status(404).json({ 
        success: false,
        error: 'Parcel not found' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch parcel', 
      details: err.message 
    });
  }
});

/**
 * GET /api/sendcloud/parcels/:id/label
 * Récupérer l'étiquette d'un colis
 */
router.get('/parcels/:id/label', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parcelId = parseInt(req.params.id, 10);
    const format = (req.query.format as 'A4' | 'A6') || 'A4';
    
    if (isNaN(parcelId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid parcel ID' 
      });
    }

    console.log(`🏷️  Récupération de l'étiquette du colis ${parcelId} (format: ${format})...`);

    const labelUrl = await getParcelLabel(parcelId, format);

    if (!labelUrl) {
      return res.status(404).json({
        success: false,
        error: 'Label not available for this parcel',
      });
    }

    return res.json({
      success: true,
      data: {
        label_url: labelUrl,
        format: format,
      },
    });

  } catch (err: any) {
    console.error('❌ Erreur récupération étiquette:', err.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch label', 
      details: err.message 
    });
  }
});

/**
 * POST /api/sendcloud/parcels/:id/cancel
 * Annuler un colis
 */
router.post('/parcels/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const parcelId = parseInt(req.params.id, 10);
    
    if (isNaN(parcelId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid parcel ID' 
      });
    }

    console.log(`🗑️  Annulation du colis ${parcelId}...`);

    const result = await cancelParcel(parcelId);

    return res.json({
      success: true,
      message: `Parcel ${parcelId} cancelled successfully`,
      data: result,
    });

  } catch (err: any) {
    console.error('❌ Erreur annulation colis:', err.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to cancel parcel', 
      details: err.message 
    });
  }
});

// ========================================
// 🚚 MÉTHODES D'EXPÉDITION
// ========================================

/**
 * GET /api/sendcloud/shipping-methods
 * Liste les méthodes d'expédition disponibles
 */
router.get('/shipping-methods', authMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🚚 Récupération des méthodes d\'expédition...');

    const methods = await getShippingMethods();

    return res.json({
      success: true,
      count: methods.length,
      data: methods,
    });

  } catch (err: any) {
    console.error('❌ Erreur récupération méthodes expédition:', err.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch shipping methods', 
      details: err.message 
    });
  }
});

export default router;
