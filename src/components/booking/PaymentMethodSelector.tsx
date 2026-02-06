import { PaymentMethod } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Smartphone, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  phoneNumber,
  onPhoneChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-heading font-semibold">Payment Method</Label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect('mpesa')}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
            selected === 'mpesa'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30'
          )}
        >
          <Smartphone className="h-6 w-6 text-green-600" />
          <span className="font-medium text-sm">M-Pesa</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect('stripe')}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
            selected === 'stripe'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30'
          )}
        >
          <CreditCard className="h-6 w-6 text-blue-600" />
          <span className="font-medium text-sm">Card/Stripe</span>
        </button>
      </div>

      {selected === 'mpesa' && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="mpesa-phone" className="text-sm">
            M-Pesa Phone Number
          </Label>
          <Input
            id="mpesa-phone"
            placeholder="e.g. 0712345678"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            You'll receive an STK push to confirm payment
          </p>
        </div>
      )}

      {selected === 'stripe' && (
        <p className="text-xs text-muted-foreground animate-fade-in">
          You'll be redirected to a secure Stripe checkout page to complete payment.
        </p>
      )}
    </div>
  );
}
