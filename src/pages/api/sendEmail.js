import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, text } = req.body;

  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-north-1.amazonaws.com', // Estocolmo
    port: 465,
    secure: true, // SSL
    auth: {
      user: 'AKIA3HBIPA3MBUV3HXPY',
      pass: 'BEpRm9q/Xd+t3A2kB9xXKY0wCryF9RxKSUSnQeFj6QIs'
    }
  });

  try {
    await transporter.sendMail({
      from: 'Yacht Daywork <info@yachtdaywork.com>',
      to,
      subject,
      text
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email via SES:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}