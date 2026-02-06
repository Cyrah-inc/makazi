import { formatFullPrice } from '@/lib/formatters';
import { SERVICE_FEE_RATE } from '@/types/booking';
import { Separator } from '@/components/ui/separator';

interface BookingSummaryProps {
  nightlyRate: number;
  nights: number;
  checkInDate?: string;
  checkOutDate?: string;
}

export function BookingSummary({ nightlyRate, nights, checkInDate, checkOutDate }: BookingSummaryProps) {
  const subtotal = nightlyRate * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <h4 className="font-heading font-semibold text-sm">Booking Summary</h4>

      {checkInDate && checkOutDate && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {new Date(checkInDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
            {' → '}
            {new Date(checkOutDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
          </span>
          <span>{nights} night{nights !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {formatFullPrice(nightlyRate)} × {nights} night{nights !== 1 ? 's' : ''}
        </span>
        <span>{formatFullPrice(subtotal)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Service fee (10%)</span>
        <span>{formatFullPrice(serviceFee)}</span>
      </div>

      <Separator />

      <div className="flex justify-between font-heading font-bold">
        <span>Total</span>
        <span className="text-primary">{formatFullPrice(total)}</span>
      </div>
    </div>
  );
}
