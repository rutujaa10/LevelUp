import twilio from 'twilio';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio credentials not configured in .env');
  return twilio(sid, token);
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await getClient().messages.create({ from, to: toFormatted, body });
}
