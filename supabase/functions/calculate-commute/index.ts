import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PropertyLocation {
  id: string;
  latitude: number;
  longitude: number;
}

interface CommuteRequest {
  destination: string;
  mode: 'driving' | 'transit' | 'walking';
  properties: PropertyLocation[];
}

interface CommuteResult {
  propertyId: string;
  durationMinutes: number | null;
  durationText: string | null;
  distanceText: string | null;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { destination, mode, properties }: CommuteRequest = await req.json();

    if (!destination || !properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: destination, properties' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating commute for ${properties.length} properties to "${destination}" via ${mode}`);

    // Google Distance Matrix API can handle up to 25 origins per request
    const BATCH_SIZE = 25;
    const results: CommuteResult[] = [];

    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE);
      const origins = batch.map(p => `${p.latitude},${p.longitude}`).join('|');

      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.searchParams.set('origins', origins);
      url.searchParams.set('destinations', destination);
      url.searchParams.set('mode', mode);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('units', 'metric');

      console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1} with ${batch.length} properties`);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Distance Matrix API error:', data.status, data.error_message);
        // Return null results for this batch
        batch.forEach(p => {
          results.push({
            propertyId: p.id,
            durationMinutes: null,
            durationText: null,
            distanceText: null,
            error: data.error_message || data.status,
          });
        });
        continue;
      }

      // Process each row (one per origin/property)
      data.rows.forEach((row: any, index: number) => {
        const property = batch[index];
        const element = row.elements[0];

        if (element.status === 'OK') {
          results.push({
            propertyId: property.id,
            durationMinutes: Math.round(element.duration.value / 60),
            durationText: element.duration.text,
            distanceText: element.distance.text,
          });
        } else {
          console.log(`No route found for property ${property.id}: ${element.status}`);
          results.push({
            propertyId: property.id,
            durationMinutes: null,
            durationText: null,
            distanceText: null,
            error: element.status,
          });
        }
      });
    }

    console.log(`Calculated commute times for ${results.length} properties`);

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating commute:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate commute times' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
