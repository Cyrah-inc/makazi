import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookingSummary } from './BookingSummary';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBooking, useSimulatePayment, usePropertyBookedDates } from '@/hooks/useBookings';
import { PaymentMethod } from '@/types/booking';
import { Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { differenceInDays, format, addDays, isSameDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';

interface BookingDialogProps {
  propertyId: string;
  landlordId: string;
  nightlyRate: number;
  propertyTitle: string;
  children: React.ReactNode;
}

export function BookingDialog({
  propertyId,
  landlordId,
  nightlyRate,
  propertyTitle,
  children,
}: BookingDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const simulatePayment = useSimulatePayment();
  const { data: bookedDates = [] } = usePropertyBookedDates(propertyId);

  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [nightsInput, setNightsInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'dates' | 'payment'>('dates');

  const nights = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from);
    }
    return 0;
  }, [dateRange]);

  const handleNightsShortcut = () => {
    const n = parseInt(nightsInput);
    if (n > 0 && dateRange?.from) {
      setDateRange({ from: dateRange.from, to: addDays(dateRange.from, n) });
    }
  };

  const isDateDisabled = (date: Date) => {
    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Don't allow already booked dates
    return bookedDates.some(d => isSameDay(d, date));
  };

  const handleConfirmDates = () => {
    if (nights <= 0) {
      toast({ title: 'Please select valid dates', variant: 'destructive' });
      return;
    }
    setStep('payment');
  };

  const handleBook = async () => {
    if (!user) {
      toast({ title: 'Please sign in to book', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    if (!dateRange?.from || !dateRange?.to || nights <= 0) {
      toast({ title: 'Please select valid dates', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'mpesa' && !phoneNumber.trim()) {
      toast({ title: 'Please enter your M-Pesa phone number', variant: 'destructive' });
      return;
    }

    try {
      const booking = await createBooking.mutateAsync({
        propertyId,
        landlordId,
        guestId: user.id,
        checkInDate: format(dateRange.from, 'yyyy-MM-dd'),
        checkOutDate: format(dateRange.to, 'yyyy-MM-dd'),
        nights,
        nightlyRate,
        paymentMethod,
        guestPhone: phoneNumber || undefined,
      });

      // Simulate payment for now (will be replaced with real payment flow)
      await simulatePayment.mutateAsync(booking.id);

      setOpen(false);
      resetForm();
      
      toast({
        title: 'Booking Confirmed!',
        description: `Your stay at ${propertyTitle} has been booked. Payment is held in escrow.`,
      });

      navigate('/dashboard/bookings');
    } catch (error: any) {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setDateRange(undefined);
    setNightsInput('');
    setPaymentMethod('mpesa');
    setPhoneNumber('');
    setStep('dates');
  };

  const isProcessing = createBooking.isPending || simulatePayment.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {step === 'dates' ? 'Select Dates' : 'Confirm & Pay'}
          </DialogTitle>
        </DialogHeader>

        {!user && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>You need to <button onClick={() => { setOpen(false); navigate('/auth'); }} className="underline font-medium">sign in</button> to book.</span>
          </div>
        )}

        {step === 'dates' && (
          <div className="space-y-4">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              disabled={isDateDisabled}
              numberOfMonths={1}
              className="rounded-lg border pointer-events-auto"
            />

            {/* Nights shortcut */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Or enter number of nights</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 3"
                  value={nightsInput}
                  onChange={(e) => setNightsInput(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNightsShortcut}
                disabled={!dateRange?.from || !nightsInput}
              >
                Apply
              </Button>
            </div>

            {nights > 0 && (
              <BookingSummary
                nightlyRate={nightlyRate}
                nights={nights}
                checkInDate={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
                checkOutDate={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined}
              />
            )}

            <Button
              className="w-full"
              onClick={handleConfirmDates}
              disabled={nights <= 0}
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <BookingSummary
              nightlyRate={nightlyRate}
              nights={nights}
              checkInDate={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
              checkOutDate={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined}
            />

            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              phoneNumber={phoneNumber}
              onPhoneChange={setPhoneNumber}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('dates')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleBook}
                disabled={isProcessing || !user}
                className="flex-1 gap-2"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Pay
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Payment will be held in escrow until you check in at the property.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
