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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${Deno.env.get('SUPABASE_URL')}?error=access_denied`,
        },
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Calculate token expiry
    const expiryDate = new Date(Date.now() + expires_in * 1000);

    // Store tokens in profiles table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendar_token: access_token,
        google_calendar_refresh_token: refresh_token,
        google_calendar_token_expiry: expiryDate.toISOString(),
      })
      .eq('id', state);

    if (updateError) {
      console.error('Error storing tokens:', updateError);
      throw new Error('Failed to store calendar tokens');
    }

    console.log('Successfully stored Google Calendar tokens for user:', state);

    // Redirect back to app with success message
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${Deno.env.get('SUPABASE_URL')}?calendar_connected=true`,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${Deno.env.get('SUPABASE_URL')}?error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
