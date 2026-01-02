import nodemailer from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  path: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  from?: string; // Custom from address (email or "Name <email>")
}

// Create SMTP transporter
// Per usare un servizio SMTP gratuito, puoi configurare:
// - Brevo (ex Sendinblue): https://www.brevo.com/ (300 email/giorno gratis)
// - Resend: https://resend.com/ (100 email/giorno gratis)
// - Gmail SMTP: smtp.gmail.com (richiede app password)
export async function sendEmail(options: SendEmailOptions) {
  // Verifica che le variabili d'ambiente siano configurate
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP non configurato. Email non inviata.');
    console.warn('Configura SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS nel file .env');
    return { success: false, error: 'SMTP non configurato' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('Email inviata: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Errore invio email:', error);
    return { success: false, error: String(error) };
  }
}
