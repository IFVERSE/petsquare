// Confirmed PetSquare WhatsApp support number, in international format.
const existingWhatsApp = '436781288256';
export function supportContacts(number = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? existingWhatsApp, helpUrl = process.env.NEXT_PUBLIC_SUPPORT_URL ?? '') {
  const digits = number.replace(/[\s()+-]/g, '');
  const whatsapp = /^[1-9]\d{6,14}$/.test(digits) ? `https://wa.me/${digits}` : '';
  let help = '';
  try {
    const url = new URL(helpUrl);
    if (url.protocol === 'https:' && !url.username && !url.password) help = url.href;
  } catch { /* An additional support page is optional. */ }
  return { whatsapp, help };
}
