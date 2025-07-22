// /api/sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const data = await resend.emails.send({
      from: 'Yacht Daywork <info@yachtdaywork.com>',
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('🛑 RESEND ERROR:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}