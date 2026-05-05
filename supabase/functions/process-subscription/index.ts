import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing subscription for user:', user.id);

    const { payment_method, phone } = await req.json();

    if (!payment_method || !['mpesa', 'stripe'].includes(payment_method)) {
      return new Response(JSON.stringify({ error: 'Invalid payment method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to verify landlord role and upsert subscription
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a landlord
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['landlord', 'admin'])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'User is not a landlord' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate payment reference
    const paymentRef = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    console.log(`Creating subscription: method=${payment_method}, ref=${paymentRef}, expires=${expiresAt.toISOString()}`);

    // SECURITY: Do NOT mark as active here — payment must be verified by the
    // M-Pesa callback or Stripe webhook before activation. Insert as pending only.
    const { data: sub, error: subError } = await adminClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        status: 'pending',
        plan: 'basic',
        amount: 2000,
        payment_method,
        payment_reference: paymentRef,
        starts_at: null,
        expires_at: null,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (subError) {
      console.error('Subscription upsert error:', subError);
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Subscription created successfully:', sub.id);

    return new Response(JSON.stringify({ success: true, subscription: sub }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
