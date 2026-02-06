export type BookingStatus = 
  | 'pending_payment' 
  | 'paid' 
  | 'checked_in' 
  | 'completed' 
  | 'cancelled' 
  | 'refunded';

export type PaymentMethod = 'mpesa' | 'stripe';

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  landlord_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  nightly_rate: number;
  total_amount: number;
  service_fee: number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  payout_reference: string | null;
  status: BookingStatus;
  guest_phone: string | null;
  landlord_phone: string | null;
  checked_in_at: string | null;
  paid_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithProperty extends Booking {
  property_title: string;
  property_image: string;
  property_city: string;
  guest_name?: string;
  guest_email?: string;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid (In Escrow)', color: 'bg-blue-100 text-blue-800' },
  checked_in: { label: 'Checked In', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', color: 'bg-primary/10 text-primary' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800' },
};

export const SERVICE_FEE_RATE = 0.10; // 10% platform fee
