import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, action } = await req.json();

    // Get secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch booking with related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        artists(name, pre_multiplier, post_multiplier),
        clients(name),
        venues(name, buffer_hours, pre_multiplier, post_multiplier),
        locations(name),
        gig_types(name, pre_multiplier, post_multiplier)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    // For now, return OAuth URL for user to authenticate
    // In production, you'd store tokens and handle the OAuth callback
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sync/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.events';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;

    console.log('Generated Google OAuth URL for booking:', bookingId);

    return new Response(
      JSON.stringify({ 
        authUrl,
        message: 'Please authenticate with Google Calendar to sync this booking'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error with Google sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
