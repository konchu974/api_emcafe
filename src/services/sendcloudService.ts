// src/services/sendcloudService.ts
import fetch from 'node-fetch';

const SENDCLOUD_API_BASE = process.env.SENDCLOUD_API_BASE || 'https://panel.sendcloud.sc/api/v2';

/**
 * Helper pour Basic Auth
 */
function getAuthHeader(): string {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY || '';
  const secretKey = process.env.SENDCLOUD_SECRET_KEY || '';
  
  if (!publicKey || !secretKey) {
    throw new Error('❌ SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY must be set in .env');
  }
  
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Interface pour le payload de création de colis
 */
export interface CreateParcelPayload {
  // Destinataire (obligatoire)
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  email: string;
  telephone: string;

  // Optionnel
  company_name?: string;
  address_2?: string;
  
  // Détails du colis
  weight: string | number;
  order_number?: string;
  sender_address?: number;
  
  // Expédition
  shipping_method_id?: number;
  request_label?: boolean;
  apply_shipping_rules?: boolean;
  
  // Point relais
  is_relay_delivery?: boolean;
  relay_point_id?: number;
  to_service_point?: number;
  
  // Articles
  items?: Array<{
    description?: string;
    product_name?: string;
    quantity: number;
    weight: string | number;
    value?: string | number;
    unit_price?: string | number;
    hs_code?: string;
    origin_country?: string;
    product_id?: string | number;
    sku?: string;
  }>;

  // Douanes (hors UE)
  customs_invoice_nr?: string;
  customs_shipment_type?: number;
}

/**
 * Récupérer l'ID de l'adresse expéditeur par défaut
 */
export async function getDefaultSenderAddress(): Promise<number> {
  try {
    console.log('📍 Récupération de l\'adresse expéditeur par défaut...');
    
    const response = await fetch(`${SENDCLOUD_API_BASE}/user/addresses/sender`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch sender addresses: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    
    if (!data.sender_addresses || data.sender_addresses.length === 0) {
      throw new Error('❌ Aucune adresse expéditeur configurée dans SendCloud. Ajoutez-en une sur https://panel.sendcloud.sc/settings/addresses');
    }

    // Retourner la première adresse ou celle marquée par défaut
    const defaultAddress = data.sender_addresses.find((addr: any) => addr.is_default) 
                        || data.sender_addresses[0];
    
    console.log(`✅ Adresse expéditeur trouvée: ID ${defaultAddress.id} - ${defaultAddress.company_name}`);
    return defaultAddress.id;
    
  } catch (error: any) {
    console.error('❌ Erreur récupération adresse expéditeur:', error.message);
    throw error;
  }
}

/**
 * Créer un colis dans SendCloud
 */
export async function createParcel(payload: CreateParcelPayload): Promise<any> {
  try {
    console.log('📦 Début création colis SendCloud...');
    console.log('📋 Payload reçu:', JSON.stringify(payload, null, 2));

    // 1️⃣ Récupérer l'adresse expéditeur si non fournie
    let senderAddressId = payload.sender_address;
    if (!senderAddressId) {
      senderAddressId = await getDefaultSenderAddress();
    }

    // 2️⃣ Construire le payload SendCloud
    const sendcloudPayload: any = {
      parcel: {
        // Destinataire (obligatoire)
        name: payload.name,
        address: payload.address,
        city: payload.city,
        postal_code: payload.postal_code,
        country: payload.country,
        email: payload.email || '',
        telephone: payload.telephone || '',

        // Optionnel
        company_name: payload.company_name || '',
        address_2: payload.address_2 || '',

        // Détails colis
        weight: String(payload.weight || '1000'), // en grammes
        order_number: payload.order_number || `ORDER-${Date.now()}`,
        sender_address: senderAddressId,

        // Options d'expédition
        request_label: payload.request_label !== false, // true par défaut
        apply_shipping_rules: payload.apply_shipping_rules !== false,
      }
    };

    // 3️⃣ Méthode d'expédition (si spécifiée)
    if (payload.shipping_method_id) {
      sendcloudPayload.parcel.shipment = {
        id: Number(payload.shipping_method_id)
      };
    }

    // 4️⃣ Point relais (si livraison en relais)
    if (payload.is_relay_delivery && payload.relay_point_id) {
      sendcloudPayload.parcel.to_service_point = Number(payload.relay_point_id);
    } else if (payload.to_service_point) {
      sendcloudPayload.parcel.to_service_point = Number(payload.to_service_point);
    }

    // 5️⃣ Articles du colis (si fournis)
    if (payload.items && payload.items.length > 0) {
      sendcloudPayload.parcel.parcel_items = payload.items.map((item: any) => ({
        description: item.description || item.product_name || 'Article',
        quantity: Number(item.quantity || 1),
        weight: String(item.weight || '100'),
        value: String(item.value || item.unit_price || '0'),
        hs_code: item.hs_code || '',
        origin_country: item.origin_country || 'FR',
        product_id: item.product_id ? String(item.product_id) : undefined,
        sku: item.sku || undefined,
      }));
    }

    // 6️⃣ Douanes (pour expéditions hors UE)
    if (payload.customs_invoice_nr) {
      sendcloudPayload.parcel.customs_invoice_nr = payload.customs_invoice_nr;
    }
    if (payload.customs_shipment_type) {
      sendcloudPayload.parcel.customs_shipment_type = payload.customs_shipment_type;
    }

    console.log('📤 Payload SendCloud final:', JSON.stringify(sendcloudPayload, null, 2));

    // 7️⃣ Appel API SendCloud
    const response = await fetch(`${SENDCLOUD_API_BASE}/parcels`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(sendcloudPayload),
    });

    // 8️⃣ Gestion erreurs
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur SendCloud API:', errorText);
      
      let errorMessage = `SendCloud API error (${response.status})`;
      
      try {
        const errorJson = JSON.parse(errorText);
        
        // Extraire le message d'erreur détaillé
        if (errorJson.error) {
          if (typeof errorJson.error === 'string') {
            errorMessage = errorJson.error;
          } else if (errorJson.error.message) {
            errorMessage = errorJson.error.message;
          } else if (errorJson.error.code) {
            errorMessage = `Error ${errorJson.error.code}`;
          }
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }

        // Ajouter les détails de validation si présents
        if (errorJson.error?.errors) {
          const validationErrors = Object.entries(errorJson.error.errors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
            .join('; ');
          errorMessage += ` - ${validationErrors}`;
        }
        
      } catch (parseError) {
        errorMessage += `: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // 9️⃣ Succès
    const result: any = await response.json();
    
    if (!result.parcel) {
      throw new Error('❌ Réponse invalide de l\'API SendCloud (pas de parcel dans la réponse)');
    }

    console.log('✅ Colis créé avec succès !');
    console.log(`   ID: ${result.parcel.id}`);
    console.log(`   Tracking: ${result.parcel.tracking_number || 'N/A'}`);
    console.log(`   Statut: ${result.parcel.status?.message || 'N/A'}`);

    return result.parcel;

  } catch (error: any) {
    console.error('❌ Erreur createParcel:', error.message);
    throw error;
  }
}

/**
 * Récupérer les détails d'un colis
 */
export async function getParcel(parcelId: number): Promise<any> {
  try {
    console.log(`📦 Récupération du colis ${parcelId}...`);

    const response = await fetch(`${SENDCLOUD_API_BASE}/parcels/${parcelId}`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch parcel ${parcelId}: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    console.log(`✅ Colis ${parcelId} récupéré`);
    
    return result.parcel;

  } catch (error: any) {
    console.error(`❌ Erreur getParcel(${parcelId}):`, error.message);
    throw error;
  }
}

/**
 * Récupérer les méthodes d'expédition disponibles
 */
export async function getShippingMethods(): Promise<any[]> {
  try {
    console.log('🚚 Récupération des méthodes d\'expédition...');

    const response = await fetch(`${SENDCLOUD_API_BASE}/shipping-methods`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch shipping methods: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    const methods = result.shipping_methods || [];
    
    console.log(`✅ ${methods.length} méthode(s) d'expédition trouvée(s)`);
    
    return methods;

  } catch (error: any) {
    console.error('❌ Erreur getShippingMethods:', error.message);
    throw error;
  }
}

/**
 * Annuler un colis
 */
export async function cancelParcel(parcelId: number): Promise<any> {
  try {
    console.log(`🗑️  Annulation du colis ${parcelId}...`);

    const response = await fetch(`${SENDCLOUD_API_BASE}/parcels/${parcelId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel parcel ${parcelId}: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    console.log(`✅ Colis ${parcelId} annulé`);
    
    return result;

  } catch (error: any) {
    console.error(`❌ Erreur cancelParcel(${parcelId}):`, error.message);
    throw error;
  }
}

/**
 * Obtenir l'étiquette PDF d'un colis
 */
export async function getParcelLabel(parcelId: number, format: 'A4' | 'A6' = 'A4'): Promise<string | null> {
  try {
    const parcel = await getParcel(parcelId);
    
    if (!parcel.label) {
      console.warn(`⚠️  Aucune étiquette disponible pour le colis ${parcelId}`);
      return null;
    }

    // Retourner l'URL selon le format demandé
    if (format === 'A6' && parcel.label.label_printer) {
      return parcel.label.label_printer;
    } else if (parcel.label.normal_printer && parcel.label.normal_printer.length > 0) {
      return parcel.label.normal_printer[0];
    }

    return null;

  } catch (error: any) {
    console.error(`❌ Erreur getParcelLabel(${parcelId}):`, error.message);
    throw error;
  }
}
