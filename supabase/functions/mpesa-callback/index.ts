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
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Optional: verify shared secret if configured
    const callbackSecret = Deno.env.get('MPESA_CALLBACK_SECRET');
    if (callbackSecret) {
      const url = new URL(req.url);
      const token = url.searchParams.get('secret');
      if (token !== callbackSecret) {
        console.warn('mpesa-callback: Invalid callback secret');
        return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let body: any;
    try {
      body = await req.json();
    } catch {
      console.warn('mpesa-callback: Invalid JSON body');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('M-Pesa callback received:', JSON.stringify(body));

    // Parse the Safaricom STK Push callback format
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.warn('mpesa-callback: Invalid callback format - missing stkCallback');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log(`mpesa-callback: CheckoutRequestID=${checkoutRequestId}, ResultCode=${resultCode}, ResultDesc=${resultDesc}`);

    if (!checkoutRequestId) {
      console.warn('mpesa-callback: Missing CheckoutRequestID');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Missing CheckoutRequestID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the booking by payment_reference which stores the CheckoutRequestID from STK push
    const { data: booking, error: lookupError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('payment_reference', checkoutRequestId)
      .eq('status', 'pending_payment') // Idempotency: only process if still pending
      .maybeSingle();

    if (lookupError) {
      console.error('mpesa-callback: Booking lookup error:', lookupError);
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Lookup error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!booking) {
      console.warn(`mpesa-callback: No pending booking found for CheckoutRequestID ${checkoutRequestId}`);
      // Return success to Safaricom to prevent retries for unknown/already-processed requests
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'No matching booking' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resultCode === 0) {
      // Payment successful - extract receipt number from callback metadata
      let mpesaReceiptNumber = '';
      const callbackItems = stkCallback.CallbackMetadata?.Item || [];
      for (const item of callbackItems) {
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceiptNumber = item.Value;
          break;
        }
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'paid',
          payment_reference: mpesaReceiptNumber || checkoutRequestId,
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('mpesa-callback: Failed to update booking:', updateError);
        throw updateError;
      }

      console.log(`mpesa-callback: Booking ${booking.id} marked as paid, receipt: ${mpesaReceiptNumber}`);
    } else {
      // Payment failed or cancelled
      console.log(`mpesa-callback: Payment failed for booking ${booking.id}: ${resultDesc}`);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_reference: `FAILED-${checkoutRequestId}`,
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('mpesa-callback: Failed to update cancelled booking:', updateError);
      }
    }

    return new Response(JSON.stringify({
      ResultCode: 0,
      ResultDesc: 'Callback processed',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mpesa-callback:', error);
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
