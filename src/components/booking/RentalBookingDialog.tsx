import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PaymentMethodSelector } from '@/components/booking/PaymentMethodSelector';
import { formatFullPrice } from '@/lib/formatters';
import { PAYMENT_STRUCTURE } from '@/types/payments';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBooking } from '@/hooks/useBookings';
import { useMpesaStkPush } from '@/hooks/useBookings';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addMonths, format } from 'date-fns';

interface RentalBookingDialogProps {
  propertyId: string;
  landlordId: string;
  monthlyRent: number;
  propertyTitle: string;
  children: React.ReactNode;
}

export function RentalBookingDialog({
  propertyId, landlordId, monthlyRent, propertyTitle, children,
}: RentalBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState('1');
  const [step, setStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'stripe'>('mpesa');
  const [phone, setPhone] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const createBooking = useCreateBooking();
  const mpesaStkPush = useMpesaStkPush();

  const numMonths = parseInt(months) || 1;
  const subtotal = monthlyRent * numMonths;
  const platformFee = Math.round(subtotal * PAYMENT_STRUCTURE.RENTAL_COMMISSION);
  const total = subtotal + platformFee;

  const startDate = new Date();
  const endDate = addMonths(startDate, numMonths);

  const handleBook = async () => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need an account to reserve a property.', variant: 'destructive' });
      return;
    }
    if (paymentMethod === 'mpesa' && !phone) {
      toast({ title: 'Phone required', description: 'Enter your M-Pesa phone number.', variant: 'destructive' });
      return;
    }

    setStep('processing');
    try {
      const booking = await createBooking.mutateAsync({
        propertyId,
        landlordId,
        guestId: user.id,
        checkInDate: format(startDate, 'yyyy-MM-dd'),
        checkOutDate: format(endDate, 'yyyy-MM-dd'),
        nights: numMonths, // repurposing nights as months for rental
        nightlyRate: monthlyRent, // repurposing as monthly rate
        paymentMethod,
        guestPhone: phone || undefined,
        bookingType: 'rental',
      });

      if (paymentMethod === 'mpesa') {
        await mpesaStkPush.mutateAsync({
          bookingId: booking.id,
          phoneNumber: phone,
          amount: total,
        });
        toast({ title: 'M-Pesa prompt sent', description: 'Enter your PIN on your phone to complete payment.' });
      }

      navigate('/dashboard/bookings');
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Booking failed', description: err.message, variant: 'destructive' });
      setStep('payment');
    }
  };

  const reset = () => {
    setStep('details');
    setMonths('1');
    setPhone('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Reserve "{propertyTitle}"</DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Rental Duration</label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} month{m > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h4 className="font-heading font-semibold text-sm">Booking Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {format(startDate, 'MMM d, yyyy')} → {format(endDate, 'MMM d, yyyy')}
                </span>
                <span>{numMonths} month{numMonths > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatFullPrice(monthlyRent)} × {numMonths} month{numMonths > 1 ? 's' : ''}
                </span>
                <span>{formatFullPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (30%)</span>
                <span>{formatFullPrice(platformFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-heading font-bold">
                <span>Total</span>
                <span className="text-primary">{formatFullPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                70% ({formatFullPrice(subtotal - platformFee + platformFee * 0)}) goes to the landlord. 30% is the platform fee.
              </p>
            </div>

            <Button className="w-full" onClick={() => setStep('payment')}>
              Continue to Payment
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodSelect={setPaymentMethod}
              mpesaPhone={phone}
              onPhoneChange={setPhone}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>Back</Button>
              <Button className="flex-1" onClick={handleBook}>
                Pay {formatFullPrice(total)}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your reservation...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
