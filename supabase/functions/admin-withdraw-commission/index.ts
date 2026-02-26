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

    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, phoneNumber, source } = await req.json();
    console.log(`Admin ${user.id} requesting withdrawal of ${amount} to ${phoneNumber}`);

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const simulatedConversationId = `ADMIN-B2C-SIM-${Date.now()}`;
    const simulatedReceipt = `ADMIN-RCPT-SIM-${Date.now()}`;

    // TODO: Replace with actual M-Pesa B2C API call

    // Record the withdrawal
    const { error: insertError } = await supabase
      .from('admin_withdrawals')
      .insert({
        admin_id: user.id,
        amount,
        phone_number: phoneNumber,
        source: source || 'mixed',
        status: 'completed', // Simulated
        mpesa_conversation_id: simulatedConversationId,
        mpesa_receipt: simulatedReceipt,
        completed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    console.log(`Admin withdrawal recorded: ${simulatedConversationId}`);

    return new Response(JSON.stringify({
      success: true,
      amount,
      reference: simulatedConversationId,
      message: 'Withdrawal processed (simulation mode)',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-withdraw-commission:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
