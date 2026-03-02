import { Button } from '@/components/ui/button';
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

  const handleClick = () => {
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <Button
      size="lg"
      className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
      onClick={handleClick}
    >
      <MessageCircle className="h-5 w-5" />
      Chat on WhatsApp
    </Button>
  );
}
