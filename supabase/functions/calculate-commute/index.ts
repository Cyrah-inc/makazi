import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommuteRequest {
  origins: { id: string; lat: number; lng: number }[];
  destination: string;
  mode: "driving" | "transit" | "walking";
}

interface CommuteResult {
  propertyId: string;
  durationMinutes: number | null;
  durationText: string | null;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const { origins, destination, mode }: CommuteRequest = await req.json();

    if (!origins || !Array.isArray(origins) || origins.length === 0) {
      throw new Error("Origins array is required");
    }

    if (!destination) {
      throw new Error("Destination is required");
    }

    // Google Distance Matrix API supports up to 25 origins per request
    const MAX_ORIGINS = 25;
    const results: CommuteResult[] = [];

    // Process in batches
    for (let i = 0; i < origins.length; i += MAX_ORIGINS) {
      const batch = origins.slice(i, i + MAX_ORIGINS);
      
      // Format origins as lat,lng pairs
      const originsParam = batch
        .map((o) => `${o.lat},${o.lng}`)
        .join("|");

      // Map mode to Google's format
      const travelMode = mode === "transit" ? "transit" : mode === "walking" ? "walking" : "driving";

      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", originsParam);
      url.searchParams.set("destinations", destination);
      url.searchParams.set("mode", travelMode);
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== "OK") {
        console.error("Distance Matrix API error:", data.status, data.error_message);
        // Return null times for this batch
        batch.forEach((origin) => {
          results.push({
            propertyId: origin.id,
            durationMinutes: null,
            durationText: null,
            error: data.error_message || data.status,
          });
        });
        continue;
      }

      // Process results
      data.rows.forEach((row: any, index: number) => {
        const element = row.elements[0];
        const origin = batch[index];

        if (element.status === "OK") {
          results.push({
            propertyId: origin.id,
            durationMinutes: Math.round(element.duration.value / 60),
            durationText: element.duration.text,
          });
        } else {
          results.push({
            propertyId: origin.id,
            durationMinutes: null,
            durationText: null,
            error: element.status,
          });
        }
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating commute:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
