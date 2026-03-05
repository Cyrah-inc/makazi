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
    e.preventDefault();
    window.open(url, '_top', 'noopener,noreferrer');
  };

  return (
    <a
      href={url}
      target="_top"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-md px-8 text-base font-medium bg-[#25D366] hover:bg-[#1da851] text-white transition-colors"
    >
      <MessageCircle className="h-5 w-5" />
      Chat on WhatsApp
    </a>
  );
}
