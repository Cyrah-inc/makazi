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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'AI service is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Please sign in to use AI descriptions' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Please sign in to use AI descriptions' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasActiveSub = sub?.status === 'active' && sub?.expires_at && new Date(sub.expires_at) > new Date();
    if (!hasActiveSub) {
      return new Response(JSON.stringify({ error: 'An active Makazi Pro subscription is required to use AI descriptions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, category, bedrooms, bathrooms, amenities, location, pricing, tone, customPrompt } = await req.json();

    const toneInstructions: Record<string, string> = {
      professional: 'Use a clear, professional tone.',
      friendly: 'Use a warm, approachable tone.',
      luxury: 'Use a refined, elegant tone.',
    };
    const toneGuide = toneInstructions[tone] || toneInstructions.professional;
    const customInstruction = customPrompt
      ? `\n\nThe landlord's specific vision: "${customPrompt}". Incorporate this naturally.`
      : '';

    const systemPrompt = `You are a Kenyan real estate copywriter. Write EXACTLY ONE concise paragraph of 50-80 words. ${toneGuide}

Style reference: "A modern one-bedroom apartment at Nanasi Heritage Apartments, offering a bright bedroom, comfortable living area, functional kitchen, and a clean bathroom. The building has only 15 apartments, providing a quiet, secure, and well-maintained environment ideal for convenient and private living."

Rules:
- Output ONLY one continuous paragraph, 50-80 words, NO line breaks
- Be descriptive and factual — list key rooms, features, and amenities naturally
- Mention the environment/neighborhood briefly (e.g., quiet, secure, well-maintained)
- NO marketing fluff, NO calls to action, NO superlatives like "stunning" or "breathtaking"
- Use Kenyan real estate terms where appropriate (e.g., "ensuite", "SQ")
- Do NOT use markdown formatting
- Do NOT include the property title or price${customInstruction}`;

    const userPrompt = `Property Details:
- Title: ${title || 'Not specified'}
- Category: ${category || 'Not specified'}
- Bedrooms: ${bedrooms || 'N/A'}
- Bathrooms: ${bathrooms || 'N/A'}
- Amenities: ${amenities?.length ? amenities.join(', ') : 'None specified'}
- Location: ${location || 'Not specified'}
- Pricing: ${pricing || 'Not specified'}

Write a single captivating paragraph description for this property.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Lovable workspace settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to generate description. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await aiResponse.json();
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
