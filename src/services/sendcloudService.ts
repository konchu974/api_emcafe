// src/services/sendcloudService.ts
import fetch from 'node-fetch';

// Helper pour Basic Auth
function getAuthHeader() {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY || '';
  const secretKey = process.env.SENDCLOUD_SECRET_KEY || '';
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function createParcel(payload: any) {
  try {
    const sendcloudPayload: any = {
      parcel: {
        name: payload.name,
        company_name: payload.company_name || '',
        address: payload.address,
        address_2: payload.address_2 || '',
        city: payload.city,
        postal_code: payload.postal_code,
        country: payload.country,
        telephone: payload.telephone || '',
        email: payload.email || '',
        weight: String(payload.weight || 1000),
        order_number: payload.order_number || '',
        request_label: true,
        apply_shipping_rules: true,
        shipment: payload.shipping_method_id ? { id: Number(payload.shipping_method_id) } : undefined,
        to_service_point: payload.is_relay_delivery && payload.relay_point_id ? Number(payload.relay_point_id) : undefined,
        parcel_items: payload.items?.map((item: any) => ({
          description: item.description || item.product_name || 'Article',
          quantity: String(item.quantity || 1),
          weight: String(item.weight || 100),
          value: String(item.value || item.unit_price || 0),
          hs_code: item.hs_code || '',
          origin_country: item.origin_country || 'FR',
          product_id: String(item.product_id || ''),
          sku: item.sku || '',
        }))
      }
    };

    const apiBase = process.env.SENDCLOUD_API_BASE || 'https://panel.sendcloud.sc/api/v2';

    const resp = await fetch(`${apiBase}/parcels`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendcloudPayload),
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      console.error('❌ Erreur SendCloud:', errorData);
      throw new Error(errorData.error || 'Failed to create parcel');
    }

    const result = await resp.json();
    return result.parcel;

  } catch (err) {
    console.error('❌ createParcel error:', err);
    throw err;
  }
}
