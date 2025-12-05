// src/services/emailService.ts
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL,
  SMTP_SECURE: SMTP_SECURE_RAW,
} = process.env;

// Convert secure flag
const SMTP_SECURE = SMTP_SECURE_RAW === "false" ? false : true;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("⚠ SMTP environment variables missing — emails will fail.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE, // SSL/TLS for port 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // cPanel servers often use custom certs
  },
});

type OrderEmailParams = {
  customerEmail?: string | null;
  orderId: string;
  amount: number;
  paymentMethod: "CARTE BANCAIRE" | "VIREMENT BANCAIRE";
};

// -----------------------------
// Customer Email HTML
// -----------------------------
function customerHtml({ orderId, amount, paymentMethod }: OrderEmailParams) {
  return `
  <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
    <h2 style="color:#5C3F32;">Merci pour votre commande EMCAFFÉ ☕</h2>
    <p>Votre commande a bien été enregistrée.</p>
    <p><strong>Numéro de commande :</strong> ${orderId}</p>
    <p><strong>Montant :</strong> ${amount.toFixed(2)} €</p>
    <p><strong>Moyen de paiement :</strong> ${paymentMethod}</p>

    <p style="margin-top:16px;">
      Nous vous tiendrons informé dès que votre commande sera expédiée.
    </p>

    <p>À très bientôt,<br/>L'équipe EMCAFFÉ</p>
  </div>`;
}

// -----------------------------
// Admin Email HTML
// -----------------------------
function adminHtml({ orderId, amount, paymentMethod }: OrderEmailParams) {
  return `
  <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
    <h2>Nouvelle commande EMCAFFÉ</h2>
    <p>Une commande vient d'être validée.</p>
    <p><strong>Numéro de commande :</strong> ${orderId}</p>
    <p><strong>Montant :</strong> ${amount.toFixed(2)} €</p>
    <p><strong>Paiement :</strong> ${paymentMethod}</p>
  </div>`;
}

// -----------------------------
// Send Customer Email
// -----------------------------
export async function sendCustomerOrderEmail(params: OrderEmailParams) {
  if (!params.customerEmail) {
    console.warn("⚠ Aucun email client fourni — email non envoyé.");
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to: params.customerEmail,
    subject: `Confirmation de votre commande EMCAFFÉ (${params.orderId})`,
    html: customerHtml(params),
  });
}

// -----------------------------
// Send Admin Email
// -----------------------------
export async function sendAdminNewOrderEmail(params: OrderEmailParams) {
  if (!ADMIN_NOTIFICATION_EMAIL) {
    console.warn("⚠ ADMIN_NOTIFICATION_EMAIL manquant — email admin non envoyé.");
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Nouvelle commande EMCAFFÉ (${params.orderId})`,
    html: adminHtml(params),
  });
}

// -----------------------------
// Send Both Emails
// -----------------------------
export async function sendOrderEmails(params: OrderEmailParams) {
  await Promise.all([
    sendCustomerOrderEmail(params).catch((err) =>
      console.error("❌ Erreur email client:", err.message)
    ),

    sendAdminNewOrderEmail(params).catch((err) =>
      console.error("❌ Erreur email admin:", err.message)
    ),
  ]);
}

