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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check subscription server-side
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasActiveSub = sub?.status === 'active' && sub?.expires_at && new Date(sub.expires_at) > new Date();
    if (!hasActiveSub) {
      return new Response(JSON.stringify({ error: 'Active subscription required to use AI descriptions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, category, bedrooms, bathrooms, amenities, location, pricing, tone } = await req.json();

    const toneInstructions: Record<string, string> = {
      professional: 'Use a professional, authoritative tone suitable for serious buyers and investors.',
      friendly: 'Use a warm, welcoming, and conversational tone that feels approachable.',
      luxury: 'Use an elegant, sophisticated tone that evokes exclusivity and premium living.',
    };

    const toneGuide = toneInstructions[tone] || toneInstructions.professional;

    const systemPrompt = `You are a Kenyan real estate copywriter. Write a compelling property listing description (150-250 words) based on the provided details. ${toneGuide}

Guidelines:
- Highlight key selling points naturally
- Mention the location and neighborhood appeal
- Reference specific amenities and features
- Include a call to action at the end
- Use Kenyan real estate terminology where appropriate (e.g., "ensuite", "SQ" for servant quarters)
- Do NOT use markdown formatting, just plain text paragraphs
- Do NOT include the property title or price in the description`;

    const userPrompt = `Property Details:
- Title: ${title || 'Not specified'}
- Category: ${category || 'Not specified'}
- Bedrooms: ${bedrooms || 'N/A'}
- Bathrooms: ${bathrooms || 'N/A'}
- Amenities: ${amenities?.length ? amenities.join(', ') : 'None specified'}
- Location: ${location || 'Not specified'}
- Pricing: ${pricing || 'Not specified'}

Write a compelling description for this property.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error('OpenAI error:', openaiResponse.status, errText);
      return new Response(JSON.stringify({ error: 'Failed to generate description. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await openaiResponse.json();
    const description = result.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ description }), {
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
