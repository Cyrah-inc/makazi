import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
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
import { useCreateBooking, useMpesaStkPush, useBookingStatusPoll } from '@/hooks/useBookings';
import { PaymentMethod } from '@/types/booking';
import { Loader2, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { differenceInDays, format, addDays, isSameDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';
import { usePropertyBookedDates } from '@/hooks/useBookings';

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
  const mpesaStkPush = useMpesaStkPush();
  const { data: bookedDates = [] } = usePropertyBookedDates(propertyId);

  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'dates' | 'payment' | 'waiting'>('dates');
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  const { data: polledBooking } = useBookingStatusPoll(
    step === 'waiting' ? pendingBookingId : null
  );

  // When payment is confirmed via callback, navigate to bookings
  useEffect(() => {
    if (polledBooking && polledBooking.status === 'paid') {
      setOpen(false);
      resetForm();
      toast({
        title: 'Payment Confirmed!',
        description: `Your stay at ${propertyTitle} has been booked. Payment is held in escrow.`,
      });
      navigate('/dashboard/bookings');
    } else if (polledBooking && polledBooking.status === 'cancelled') {
      setStep('payment');
      setPendingBookingId(null);
      toast({
        title: 'Payment Failed',
        description: 'The M-Pesa payment was not completed. Please try again.',
        variant: 'destructive',
      });
    }
  }, [polledBooking?.status]);

  const nights = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from);
    }
    return 0;
  }, [dateRange]);

  const handlePresetClick = (n: number) => {
    if (dateRange?.from) {
      setDateRange({ from: dateRange.from, to: addDays(dateRange.from, n) });
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
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
      // 1. Create booking in pending_payment status
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

      if (paymentMethod === 'mpesa') {
        // 2. Trigger M-Pesa STK Push
        const result = await mpesaStkPush.mutateAsync({
          bookingId: booking.id,
          phoneNumber: phoneNumber,
        });

        // 3. Move to waiting step — poll for callback
        setPendingBookingId(booking.id);
        setStep('waiting');
        toast({
          title: 'Check your phone',
          description: result.message || 'Enter your M-Pesa PIN to complete payment.',
        });
      } else {
        // Stripe flow — redirect to checkout (TODO: implement)
        toast({
          title: 'Stripe not yet configured',
          description: 'Please use M-Pesa for now.',
          variant: 'destructive',
        });
      }
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
    setPaymentMethod('mpesa');
    setPhoneNumber('');
    setStep('dates');
    setPendingBookingId(null);
  };

  const isProcessing = createBooking.isPending || mpesaStkPush.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {step === 'dates' ? 'Select Dates' : step === 'payment' ? 'Confirm & Pay' : 'Waiting for Payment'}
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
            {/* Check-in / Check-out display header */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg border p-3 text-center ${dateRange?.from ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}`}>
                <p className="text-xs text-muted-foreground mb-1">Check-in</p>
                <p className="font-semibold text-sm">
                  {dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'Select date'}
                </p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${dateRange?.to ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30'}`}>
                <p className="text-xs text-muted-foreground mb-1">Check-out</p>
                <p className="font-semibold text-sm">
                  {dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select date'}
                </p>
              </div>
            </div>

            {/* Guidance text */}
            <p className="text-xs text-center text-muted-foreground">
              {!dateRange?.from
                ? 'Tap your check-in date on the calendar'
                : !dateRange?.to
                ? 'Now tap your check-out date'
                : `${nights} night${nights !== 1 ? 's' : ''} selected`}
            </p>

            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              disabled={isDateDisabled}
              numberOfMonths={1}
              className="rounded-lg border pointer-events-auto"
            />

            {/* Quick night presets */}
            {dateRange?.from && !dateRange?.to && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Quick select nights</p>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 5, 7].map((n) => (
                    <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => handlePresetClick(n)}
                    >
                      {n} night{n !== 1 ? 's' : ''}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear dates */}
            {(dateRange?.from || dateRange?.to) && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => setDateRange(undefined)}
              >
                Clear dates
              </button>
            )}

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

        {step === 'waiting' && (
          <div className="space-y-6 py-4 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <Smartphone className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">STK Push Sent</h3>
              <p className="text-sm text-muted-foreground">
                A payment prompt has been sent to your phone. Enter your M-Pesa PIN to complete the payment.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for confirmation...
            </div>
            <Button variant="outline" onClick={() => { setStep('payment'); setPendingBookingId(null); }}>
              Cancel & Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
