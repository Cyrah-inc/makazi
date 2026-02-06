import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookingWithProperty } from '@/types/booking';
import { useCheckIn } from '@/hooks/useBookings';
import { LogIn, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CheckInButtonProps {
  booking: BookingWithProperty;
}

export function CheckInButton({ booking }: CheckInButtonProps) {
  const checkIn = useCheckIn();
  const [open, setOpen] = useState(false);

  // Only show for paid bookings
  if (booking.status !== 'paid') return null;

  // Check if today is on or after check-in date (with 1-day grace)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(booking.check_in_date);
  checkInDate.setHours(0, 0, 0, 0);

  const gracePeriod = new Date(checkInDate);
  gracePeriod.setDate(gracePeriod.getDate() - 1);

  const isEligible = today >= gracePeriod;

  if (!isEligible) {
    return (
      <Button disabled variant="outline" className="w-full gap-2">
        <LogIn className="h-4 w-4" />
        Check-in available from {checkInDate.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" className="w-full gap-2 bg-green-600 hover:bg-green-700">
          <LogIn className="h-4 w-4" />
          Check In Now
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Check-In</AlertDialogTitle>
          <AlertDialogDescription>
            By checking in, you confirm you have arrived at <strong>{booking.property_title}</strong>. 
            The payment held in escrow will be released to the landlord.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => checkIn.mutate(booking.id)}
            disabled={checkIn.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {checkIn.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogIn className="h-4 w-4 mr-2" />
            )}
            Confirm Check-In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
