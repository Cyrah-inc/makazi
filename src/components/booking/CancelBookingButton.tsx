import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCancelBooking } from '@/hooks/useBookings';
import { XCircle, Loader2 } from 'lucide-react';
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

interface CancelBookingButtonProps {
  bookingId: string;
  status: string;
}

export function CancelBookingButton({ bookingId, status }: CancelBookingButtonProps) {
  const cancelBooking = useCancelBooking();
  const [open, setOpen] = useState(false);

  // Only allow cancellation for pending_payment bookings
  if (status !== 'pending_payment') return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
          <XCircle className="h-4 w-4" />
          Cancel Booking
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The booking will be marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => cancelBooking.mutate(bookingId)}
            disabled={cancelBooking.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelBooking.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Cancel Booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
