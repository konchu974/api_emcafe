// src/services/emailService.ts
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  ADMIN_NOTIFICATION_EMAIL,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn("⚠ SMTP environment variables missing — emails will fail.");
}

/**
 * Transporter for cPanel SMTP using port 26 (NON-SSL)
 */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),   // should be 26
  secure: false,             // ❗ MUST be false on port 26
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allow cPanel certs
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
  const trackUrl = `https://emcaffe-front.onrender.com/fr/track-order/${orderId}`; // URL pour suivre la commande

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

    <p style="margin-top:16px;">
      Pour suivre votre commande, cliquez sur ce lien :
      <a href="${trackUrl}" target="_blank" style="color:#5C3F32; text-decoration:underline;">Suivre ma commande</a>
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
// Send Both
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

// -----------------------------
// Password Reset Email Types
// -----------------------------
type PasswordResetEmailParams = {
  email: string;
  token: string;
  firstName?: string;
};

// -----------------------------
// Password Reset Email HTML
// -----------------------------
function passwordResetHtml({ token, firstName }: PasswordResetEmailParams) {
  const resetUrl = `https://emcaffe-front.onrender.com/fr/reset-password?token=${token}`;

  return `
  <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
    <h2 style="color:#5C3F32;">Réinitialisation de votre mot de passe EMCAFFÉ</h2>
    
    ${firstName ? `<p>Bonjour ${firstName},</p>` : '<p>Bonjour,</p>'}
    
    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
    
    <p>Veuillez utiliser le code suivant pour réinitialiser votre mot de passe :</p>
    
    <div style="background-color:#f5f5f5; padding:20px; margin:20px 0; border-radius:8px; text-align:center;">
      <h1 style="color:#5C3F32; font-size:32px; letter-spacing:4px; margin:0;">
        ${token}
      </h1>
    </div>
    
    <p>Ou cliquez sur ce lien :</p>
    <p>
      <a href="${resetUrl}" 
         target="_blank" 
         style="background-color:#5C3F32; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; display:inline-block;">
        Réinitialiser mon mot de passe
      </a>
    </p>
    
    <p style="color:#666; font-size:14px; margin-top:24px;">
      ⚠️ Ce code expire dans <strong>1 heure</strong>.
    </p>
    
    <p style="color:#666; font-size:14px;">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
    
    <p style="margin-top:24px;">
      Cordialement,<br/>
      L'équipe EMCAFFÉ ☕
    </p>
  </div>`;
}

// -----------------------------
// Send Password Reset Email
// -----------------------------
export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to: params.email,
    subject: 'Réinitialisation de votre mot de passe EMCAFFÉ',
    html: passwordResetHtml(params),
  });
}

