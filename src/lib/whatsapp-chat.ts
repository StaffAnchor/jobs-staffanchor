// The StaffAnchor WhatsApp Business number candidates can message. A click opens a
// chat with the message already typed in, so a candidate only taps Send. When they
// message first, WhatsApp opens a free 24-hour window in which we can reply normally.
const NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "911204128963").replace(/\D/g, "");

export function whatsappChatLink(text: string): string {
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`;
}
