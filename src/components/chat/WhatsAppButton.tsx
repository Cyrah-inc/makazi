import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  propertyTitle: string;
}

export function WhatsAppButton({ phone, propertyTitle }: WhatsAppButtonProps) {
  const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^0/, '254');
  const message = encodeURIComponent(
    `Hi, I'm interested in "${propertyTitle}" listed on Makazi. Is it still available?`
  );
  const url = `https://wa.me/${cleanPhone}?text=${message}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Try opening as popup first (best UX — doesn't navigate away)
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      e.preventDefault(); // Popup succeeded, stop anchor navigation
    }
    // If popup blocked, let the <a target="_top"> handle it natively
    // target="_top" breaks out of iframe at HTML level (no cross-origin JS needed)
  };

  return (
    <a
      href={url}
      target="_top"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-md px-8 text-base font-medium bg-[#25D366] hover:bg-[#1da851] text-white transition-colors cursor-pointer"
    >
      <MessageCircle className="h-5 w-5" />
      Chat on WhatsApp
    </a>
  );
}
