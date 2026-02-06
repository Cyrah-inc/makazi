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

    // This is a callback from Safaricom - no auth header needed
    const body = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(body));

    // TODO: Parse Safaricom callback format
    // Extract: ResultCode, ResultDesc, MpesaReceiptNumber, TransactionDate, PhoneNumber
    // Match to booking via checkout request ID stored during STK push

    // For now, log the callback
    return new Response(JSON.stringify({
      ResultCode: 0,
      ResultDesc: 'Callback received',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mpesa-callback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
