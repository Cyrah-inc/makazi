import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Daraja API base URL — defaults to sandbox unless MPESA_ENVIRONMENT=production
const MPESA_ENV = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';
const DARAJA_BASE = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getOAuthToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token request failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+254')) cleaned = cleaned.substring(1);
  else if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  else if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
  return cleaned;
}

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

    const { bookingId, phoneNumber } = await req.json();
    console.log(`M-Pesa STK Push (${MPESA_ENV}) for booking ${bookingId}, phone: ${phoneNumber}`);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('guest_id', user.id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (booking.status !== 'pending_payment') {
      return new Response(JSON.stringify({ error: 'Booking already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get M-Pesa credentials
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      console.error('M-Pesa credentials not configured');
      return new Response(JSON.stringify({ error: 'M-Pesa is not configured on the server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get OAuth token
    const accessToken = await getOAuthToken(consumerKey, consumerSecret);
    console.log('Got Daraja OAuth token');

    // 2. Build STK Push request
    const timestamp = generateTimestamp();
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const amount = Math.ceil(booking.total_amount); // M-Pesa requires whole numbers

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `Makazi-${bookingId.substring(0, 8)}`,
      TransactionDesc: `Booking payment for ${bookingId.substring(0, 8)}`,
    };

    console.log('Sending STK Push:', JSON.stringify({ ...stkPayload, Password: '[REDACTED]' }));

    // 3. Send STK Push
    const stkRes = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();
    console.log('STK Push response:', JSON.stringify(stkData));

    if (stkData.ResponseCode !== '0') {
      throw new Error(stkData.ResponseDescription || stkData.errorMessage || 'STK Push failed');
    }

    // 4. Store the CheckoutRequestID so the callback can match it
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_reference: stkData.CheckoutRequestID })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to store CheckoutRequestID:', updateError);
    }

    return new Response(JSON.stringify({
      mode: 'live',
      message: 'STK Push sent. Check your phone to enter your M-Pesa PIN.',
      checkoutRequestId: stkData.CheckoutRequestID,
      bookingId: booking.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mpesa-stk-push:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
