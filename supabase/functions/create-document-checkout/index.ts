import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DARAJA_BASE = (Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox') === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getOAuthToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get OAuth token');
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const { property_id, phone_number } = await req.json();
    if (!property_id || !phone_number) {
      return new Response(JSON.stringify({ error: 'property_id and phone_number are required' }), { status: 400, headers: corsHeaders });
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from('document_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', property_id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Documents already purchased', already_purchased: true }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create pending purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('document_purchases')
      .insert({
        user_id: userId,
        property_id,
        amount: 1500,
        payment_method: 'mpesa',
        status: 'pending',
      })
      .select('id')
      .single();

    if (purchaseError) {
      return new Response(JSON.stringify({ error: purchaseError.message }), { status: 500, headers: corsHeaders });
    }

    // Initiate M-Pesa STK Push
    const consumerKey = (Deno.env.get('MPESA_CONSUMER_KEY') || '').trim();
    const consumerSecret = (Deno.env.get('MPESA_CONSUMER_SECRET') || '').trim();
    const shortcode = (Deno.env.get('MPESA_SHORTCODE') || '174379').trim();
    const passkey = (Deno.env.get('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919').trim();
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/document-purchase-callback`;

    const accessToken = await getOAuthToken(consumerKey, consumerSecret);
    const timestamp = generateTimestamp();
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    const formattedPhone = formatPhoneNumber(phone_number);

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1500,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `DOC-${purchase.id.substring(0, 8)}`,
      TransactionDesc: 'Property Document Access',
    };

    const stkRes = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== '0') {
      // Update purchase to failed
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await adminClient.from('document_purchases').update({ status: 'failed' }).eq('id', purchase.id);
      return new Response(JSON.stringify({ error: stkData.ResponseDescription || 'STK push failed' }), { status: 500, headers: corsHeaders });
    }

    // Store checkout request ID as payment_reference
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await adminClient.from('document_purchases').update({
      payment_reference: stkData.CheckoutRequestID,
    }).eq('id', purchase.id);

    return new Response(JSON.stringify({
      success: true,
      purchase_id: purchase.id,
      checkout_request_id: stkData.CheckoutRequestID,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
