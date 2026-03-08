import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { bookingId, phoneNumber } = await req.json();
    console.log(`Processing payout for booking ${bookingId} to phone ${phoneNumber}`);

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

    // Authorization: only the booking's landlord or an admin
    if (booking.landlord_id !== user.id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Not authorized to process this payout' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (booking.status !== 'checked_in') {
      return new Response(JSON.stringify({ error: 'Booking must be checked in for payout' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate payout amount (total minus service fee)
    const payoutAmount = booking.total_amount - booking.service_fee;
    const simulatedConversationId = `B2C-SIM-${Date.now()}`;
    const simulatedReceipt = `RCPT-SIM-${Date.now()}`;

    console.log(`Payout amount: ${payoutAmount} to landlord ${booking.landlord_id}`);

    // Create payout record
    const { error: payoutInsertError } = await supabase
      .from('payouts')
      .insert({
        booking_id: bookingId,
        landlord_id: booking.landlord_id,
        amount: payoutAmount,
        phone_number: phoneNumber,
        status: 'completed',
        mpesa_conversation_id: simulatedConversationId,
        mpesa_receipt: simulatedReceipt,
        completed_at: new Date().toISOString(),
      });

    if (payoutInsertError) {
      console.error('Failed to insert payout record:', payoutInsertError);
      throw payoutInsertError;
    }

    // Update booking status to completed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        paid_out_at: new Date().toISOString(),
        payout_reference: simulatedConversationId,
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Send in-app notification to the landlord
    const formattedAmount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(payoutAmount);
    await supabase.from('notifications').insert({
      user_id: booking.landlord_id,
      title: 'Payout Processed',
      message: `Your payout of ${formattedAmount} has been sent to ${phoneNumber}. Reference: ${simulatedReceipt}`,
      type: 'payout_success',
      link: '/landlord/payouts',
    });

    console.log(`Booking ${bookingId} marked as completed with payout`);

    return new Response(JSON.stringify({
      success: true,
      payoutAmount,
      payoutReference: simulatedConversationId,
      message: 'Payout processed (simulation mode — B2C integration pending)',
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
