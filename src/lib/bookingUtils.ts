import { differenceInDays, isPast, isToday, isFuture } from 'date-fns';

/**
 * Get a relative label for a booking based on its dates and status
 */
export function getBookingRelativeLabel(
  checkInDate: string,
  checkOutDate: string,
  status: string
): { text: string; variant: 'upcoming' | 'active' | 'past' | 'neutral' } {
  if (status === 'cancelled') return { text: 'Cancelled', variant: 'neutral' };
  if (status === 'refunded') return { text: 'Refunded', variant: 'neutral' };
  if (status === 'completed') return { text: 'Completed', variant: 'past' };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);
  const checkOut = new Date(checkOutDate);
  checkOut.setHours(0, 0, 0, 0);

  if (status === 'checked_in') {
    const daysLeft = differenceInDays(checkOut, now);
    if (daysLeft <= 0) return { text: 'Checkout today', variant: 'active' };
    return { text: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`, variant: 'active' };
  }

  if (isFuture(checkIn) || isToday(checkIn)) {
    const daysUntil = differenceInDays(checkIn, now);
    if (daysUntil === 0) return { text: 'Check-in today', variant: 'upcoming' };
    if (daysUntil === 1) return { text: 'Check-in tomorrow', variant: 'upcoming' };
    return { text: `${daysUntil} days until check-in`, variant: 'upcoming' };
  }

  if (isPast(checkOut)) {
    const daysAgo = differenceInDays(now, checkOut);
    if (daysAgo === 0) return { text: 'Checked out today', variant: 'past' };
    if (daysAgo === 1) return { text: 'Stayed yesterday', variant: 'past' };
    return { text: `Stayed ${daysAgo} days ago`, variant: 'past' };
  }

  return { text: 'Currently staying', variant: 'active' };
}
