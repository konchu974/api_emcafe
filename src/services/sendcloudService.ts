// src/services/sendcloudService.ts
import fetch from 'node-fetch';

const SENDCLOUD_API_BASE =
  process.env.SENDCLOUD_API_BASE || 'https://panel.sendcloud.sc/api/v2';

/* ======================================================
   AUTH – Basic Auth Sendcloud
====================================================== */
function getAuthHeader(): string {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY;
  const secretKey = process.env.SENDCLOUD_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error(
      '❌ SENDCLOUD_PUBLIC_KEY et SENDCLOUD_SECRET_KEY doivent être définies'
    );
  }

  return (
    'Basic ' +
    Buffer.from(`${publicKey}:${secretKey}`).toString('base64')
  );
}

/* ======================================================
   SENDER ADDRESS – récupérée une fois (cache)
====================================================== */
let cachedSenderAddressId: number | null = null;

export async function getDefaultSenderAddress(): Promise<number> {
  if (cachedSenderAddressId) return cachedSenderAddressId;

  const response = await fetch(
    `${SENDCLOUD_API_BASE}/user/addresses/sender`,
    {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data: any = await response.json();

  if (!data.sender_addresses || data.sender_addresses.length === 0) {
    throw new Error(
      '❌ Aucune adresse expéditeur configurée dans Sendcloud'
    );
  }

  const sender =
    data.sender_addresses.find((a: any) => a.is_default) ??
    data.sender_addresses[0];

  cachedSenderAddressId = sender.id;
  return sender.id;
}

/* ======================================================
   CREATE PARCEL
====================================================== */
export interface CreateParcelPayload {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  email: string;
  telephone: string;

  company_name?: string;
  address_2?: string;

  weight: number; // EN GRAMMES
  order_number?: string;
  sender_address?: number;

  shipping_method_id?: number;
  to_service_point?: number;

  items?: Array<{
    description?: string;
    product_name?: string;
    quantity: number;
    weight: number; // EN GRAMMES
    value?: number | string;
    hs_code?: string;
    origin_country?: string;
    sku?: string;
  }>;
}

export async function createParcel(
  payload: CreateParcelPayload
): Promise<any> {
  const senderAddressId =
    payload.sender_address ?? (await getDefaultSenderAddress());

  const parcel: any = {
    name: payload.name,
    address: payload.address,
    city: payload.city,
    postal_code: payload.postal_code,
    country: payload.country,
    email: payload.email,
    telephone: payload.telephone,

    sender_address: senderAddressId,
    order_number: payload.order_number ?? `ORDER-${Date.now()}`,

    // 🔥 Sendcloud attend des KG
    weight: (payload.weight / 1000).toFixed(3),

    // recommandé en ecommerce
    request_label: false,
  };

  if (payload.company_name) parcel.company_name = payload.company_name;
  if (payload.address_2) parcel.address_2 = payload.address_2;

  // Méthode d’expédition connue (optionnel)
  if (payload.shipping_method_id) {
    parcel.shipment = { id: payload.shipping_method_id };
  }

  // Point relais
  if (payload.to_service_point) {
    parcel.to_service_point = payload.to_service_point;
  }

  // Articles
  if (payload.items && payload.items.length > 0) {
    parcel.parcel_items = payload.items.map((item) => ({
      description:
        item.description ?? item.product_name ?? 'Article',
      quantity: item.quantity,
      weight: (item.weight / 1000).toFixed(3),
      value: String(item.value ?? '0'),
      hs_code: item.hs_code,
      origin_country: item.origin_country ?? 'FR',
      sku: item.sku,
    }));
  }

  const response = await fetch(`${SENDCLOUD_API_BASE}/parcels`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ parcel }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result: any = await response.json();
  return result.parcel;
}

/* ======================================================
   GET PARCEL
====================================================== */
export async function getParcel(parcelId: number): Promise<any> {
  const response = await fetch(
    `${SENDCLOUD_API_BASE}/parcels/${parcelId}`,
    {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result: any = await response.json();
  return result.parcel;
}

/* ======================================================
   CANCEL PARCEL
====================================================== */
export async function cancelParcel(parcelId: number): Promise<any> {
  const response = await fetch(
    `${SENDCLOUD_API_BASE}/parcels/${parcelId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

/* ======================================================
   GET PARCEL LABEL
====================================================== */
export async function getParcelLabel(
  parcelId: number,
  format: 'A4' | 'A6' = 'A4'
): Promise<string | null> {
  const parcel = await getParcel(parcelId);

  if (!parcel.label) return null;

  if (format === 'A6' && parcel.label.label_printer) {
    return parcel.label.label_printer;
  }

  if (
    parcel.label.normal_printer &&
    parcel.label.normal_printer.length > 0
  ) {
    return parcel.label.normal_printer[0];
  }

  return null;
}
