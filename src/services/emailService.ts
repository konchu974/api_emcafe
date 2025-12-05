// src/services/emailService.ts
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE !== "false", // SSL enabled
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // required on cPanel hosting
  },
});

type OrderEmailParams = {
  customerEmail?: string | null;
  orderId: string;
  amount: number;
  paymentMethod: "CARTE BANCAIRE" | "VIREMENT BANCAIRE";
};

function customerHtml({ orderId, amount, paymentMethod }: OrderEmailParams) {
  return `
  <div style="font-family:Arial">
    <h2>Merci pour votre commande EMCAFFÉ ☕</h2>
    <p>Nous confirmons votre paiement.</p>
    <p><strong>Commande :</strong> ${orderId}</p>
    <p><strong>Montant :</strong> ${amount.toFixed(2)} €</p>
    <p><strong>Paiement :</strong> ${paymentMethod}</p>
    <p>Nous vous notifierons dès que la commande sera expédiée.</p>
  </div>`;
}

function adminHtml({ orderId, amount, paymentMethod }: OrderEmailParams) {
  return `
  <div style="font-family:Arial">
    <h2>NOUVELLE COMMANDE EMCAFFÉ</h2>
    <p>Commande payée.</p>
    <p><strong>ID :</strong> ${orderId}</p>
    <p><strong>Montant :</strong> ${amount.toFixed(2)} €</p>
    <p><strong>Paiement :</strong> ${paymentMethod}</p>
  </div>`;
}

export async function sendCustomerOrderEmail(params: OrderEmailParams) {
  if (!params.customerEmail) {
    console.warn("⚠ Aucun email client, skip.");
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to: params.customerEmail,
    subject: `Confirmation commande EMCAFFÉ (${params.orderId})`,
    html: customerHtml(params),
  });
}

export async function sendAdminNewOrderEmail(params: OrderEmailParams) {
  if (!ADMIN_NOTIFICATION_EMAIL) return;

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Nouvelle commande EMCAFFÉ (${params.orderId})`,
    html: adminHtml(params),
  });
}

export async function sendOrderEmails(params: OrderEmailParams) {
  await Promise.all([
    sendCustomerOrderEmail(params),
    sendAdminNewOrderEmail(params),
  ]);
}
