import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  propertyTitle: string;
  onLeadCapture?: () => void;
}

export function WhatsAppButton({ phone, propertyTitle, onLeadCapture }: WhatsAppButtonProps) {
  const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^0/, '254');
  const message = encodeURIComponent(
    `Hi, I'm interested in "${propertyTitle}" listed on Makazi. Is it still available?`
  );
  const url = `https://wa.me/${cleanPhone}?text=${message}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onLeadCapture?.();
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      e.preventDefault();
    }
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
