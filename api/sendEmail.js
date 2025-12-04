// /api/sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function sanitizeHtmlContent(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

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
      html: sanitizeHtmlContent(html),
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('🛑 Resend error:', error?.message || 'unknown error');

    if (error?.response) {
      const { statusCode, message, name } = error.response;
      return res.status(500).json({
        error: 'Resend API error',
        statusCode,
        message,
        name
      });
    }

    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message || 'Failed to send email'
    });
  }
}
