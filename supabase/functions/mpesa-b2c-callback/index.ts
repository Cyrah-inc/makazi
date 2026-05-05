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
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const callbackSecret = Deno.env.get('MPESA_CALLBACK_SECRET');
    if (!callbackSecret) {
      console.error('mpesa-b2c-callback: MPESA_CALLBACK_SECRET not configured — rejecting request');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Callback secret not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const url = new URL(req.url);
    if (url.searchParams.get('secret') !== callbackSecret) {
      console.warn('mpesa-b2c-callback: Invalid callback secret');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let body: any;
    try {
      body = await req.json();
    } catch {
      console.warn('mpesa-b2c-callback: Invalid JSON body');
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Invalid body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('B2C Callback received:', JSON.stringify(body));

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

    // Find the payout to get the landlord_id for notifications
    const { data: payout } = await supabase
      .from('payouts')
      .select('landlord_id, amount, phone_number')
      .eq('mpesa_conversation_id', conversationId)
      .maybeSingle();

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

      // Notify landlord of successful payout
      if (payout) {
        const formattedAmount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(payout.amount);
        await supabase.from('notifications').insert({
          user_id: payout.landlord_id,
          title: 'Payout Received',
          message: `Your payout of ${formattedAmount} to ${payout.phone_number} was successful. Receipt: ${transactionId}`,
          type: 'payout_success',
          link: '/landlord/payouts',
        });
      }
    } else {
      // Failed
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'failed' })
        .eq('mpesa_conversation_id', conversationId);

      if (error) console.error('Failed to update payout:', error);
      console.log(`Payout ${conversationId} marked as failed: ${result.ResultDesc}`);

      // Notify landlord of failed payout
      if (payout) {
        const formattedAmount = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(payout.amount);
        await supabase.from('notifications').insert({
          user_id: payout.landlord_id,
          title: 'Payout Failed',
          message: `Your payout of ${formattedAmount} to ${payout.phone_number} failed. Please try again or contact support.`,
          type: 'payout_failed',
          link: '/landlord/payouts',
        });
      }
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
