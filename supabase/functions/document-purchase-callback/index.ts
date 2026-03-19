import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    // Optional secret validation
    const callbackSecret = Deno.env.get('MPESA_CALLBACK_SECRET');
    if (callbackSecret) {
      const url = new URL(req.url);
      const secret = url.searchParams.get('secret');
      if (secret !== callbackSecret) {
        return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid callback' }), { status: 400, headers: corsHeaders });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find the purchase by payment_reference
    const { data: purchase } = await supabase
      .from('document_purchases')
      .select('id, status')
      .eq('payment_reference', checkoutRequestId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!purchase) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'No matching purchase' }), { headers: corsHeaders });
    }

    if (resultCode === 0) {
      // Extract M-Pesa receipt
      let receiptNumber = checkoutRequestId;
      const items = callback.CallbackMetadata?.Item;
      if (Array.isArray(items)) {
        const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
        if (receipt?.Value) receiptNumber = receipt.Value;
      }

      await supabase.from('document_purchases').update({
        status: 'completed',
        payment_reference: receiptNumber,
      }).eq('id', purchase.id);
    } else {
      await supabase.from('document_purchases').update({
        status: 'failed',
        payment_reference: `FAILED-${checkoutRequestId}`,
      }).eq('id', purchase.id);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Callback processed' }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: err.message }), { status: 500, headers: corsHeaders });
  }
});
