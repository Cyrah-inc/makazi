import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  propertyTitle: string;
}

export function WhatsAppButton({ phone, propertyTitle }: WhatsAppButtonProps) {
  // Clean phone number - remove spaces, dashes, ensure starts with country code
  const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^0/, '254');
  const message = encodeURIComponent(
    `Hi, I'm interested in "${propertyTitle}" listed on Makazi. Is it still available?`
  );

  return (
    <a
      href={`https://wa.me/${cleanPhone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Button
        size="lg"
        className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
      >
        <MessageCircle className="h-5 w-5" />
        Chat on WhatsApp
      </Button>
    </a>
  );
}
