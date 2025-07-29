import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Add the current timestamp to the response for debugging
  const deploymentTimestamp = new Date().toISOString();

  const payload = {
    plan: `The Tournament Planner AI is temporarily unavailable. We are working on an upgrade and will bring it back soon. Please proceed with the manual setup for now. (Deployment: ${deploymentTimestamp})`,
    status: "unavailable",
  };

  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});