import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId } = await req.json();
    console.log(`Processing payout for booking ${bookingId}`);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (booking.status !== 'checked_in') {
      return new Response(JSON.stringify({ error: 'Booking must be checked in for payout' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate payout amount (total minus service fee)
    const payoutAmount = booking.total_amount - booking.service_fee;
    console.log(`Payout amount: ${payoutAmount} to landlord ${booking.landlord_id}`);

    // TODO: When payment providers are configured:
    // - For Stripe: Create a Stripe Transfer to landlord's connected account
    // - For M-Pesa: Initiate B2C payment to landlord's phone

    // For now, mark as completed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        paid_out_at: new Date().toISOString(),
        payout_reference: `PAYOUT-SIM-${Date.now()}`,
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    console.log(`Booking ${bookingId} marked as completed`);

    return new Response(JSON.stringify({
      success: true,
      payoutAmount,
      message: 'Payout processed (simulation mode)',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-booking-payout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
