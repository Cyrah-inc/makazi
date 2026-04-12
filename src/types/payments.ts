/**
 * Centralized payment structure for the Makazi platform.
 * All fees, commissions, and charges are defined here.
 */

export const PAYMENT_STRUCTURE = {
  /** 10% platform fee on Airbnb (short-stay) bookings — landlord receives 90% */
  AIRBNB_COMMISSION: 0.10,

  /** 30% platform fee on rental (long-term) bookings — landlord receives 70% */
  RENTAL_COMMISSION: 0.30,

  /** KES 2,000/month landlord subscription for Makazi Pro */
  LANDLORD_SUBSCRIPTION: 2000,

  /** KES 1,500 one-time fee for buyers to download sale verification documents */
  DOCUMENT_ACCESS_FEE: 1500,
} as const;

/** Helper to get commission rate by booking type */
export function getCommissionRate(bookingType: 'airbnb' | 'rental'): number {
  return bookingType === 'rental'
    ? PAYMENT_STRUCTURE.RENTAL_COMMISSION
    : PAYMENT_STRUCTURE.AIRBNB_COMMISSION;
}

/** Helper to get landlord payout percentage */
export function getLandlordPayoutRate(bookingType: 'airbnb' | 'rental'): number {
  return 1 - getCommissionRate(bookingType);
}
