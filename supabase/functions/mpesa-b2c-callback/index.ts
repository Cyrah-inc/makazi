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

    const body = await req.json();
    console.log('B2C Callback received:', JSON.stringify(body));

    // Safaricom B2C callback structure
    const result = body.Result;
    if (!result) {
      console.error('Invalid callback: no Result field');
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversationId = result.ConversationID;
    const resultCode = result.ResultCode;
    const transactionId = result.TransactionID;

    console.log(`B2C Result: ConversationID=${conversationId}, ResultCode=${resultCode}, TransactionID=${transactionId}`);

    if (resultCode === 0) {
      // Success — update payout record
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          mpesa_receipt: transactionId,
          completed_at: new Date().toISOString(),
        })
        .eq('mpesa_conversation_id', conversationId);

      if (error) console.error('Failed to update payout:', error);
      else console.log(`Payout ${conversationId} marked as completed`);
    } else {
      // Failed
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'failed' })
        .eq('mpesa_conversation_id', conversationId);

      if (error) console.error('Failed to update payout:', error);
      console.log(`Payout ${conversationId} marked as failed: ${result.ResultDesc}`);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mpesa-b2c-callback:', error);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
