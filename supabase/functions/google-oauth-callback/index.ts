import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// OAuth callback is a redirect-based flow, CORS headers are not needed for the main flow
// but we keep them for error responses that might be fetched
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://showpro-gig-flow.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateToken = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Get the app origin for redirects
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://showpro-gig-flow.lovable.app';

    if (error) {
      console.log('OAuth error received:', error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${appOrigin}?error=access_denied`,
        },
      });
    }

    if (!code || !stateToken) {
      console.error('Missing authorization code or state token');
      throw new Error('Missing authorization code or state');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Use service role client to validate state token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate state token and get user_id
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('user_id, expires_at')
      .eq('state_token', stateToken)
      .single();

    if (stateError || !stateData) {
      console.error('Invalid or missing state token:', stateToken, stateError);
      throw new Error('Invalid OAuth state - please try connecting again');
    }

    // Check if state token has expired
    const expiresAt = new Date(stateData.expires_at);
    if (expiresAt < new Date()) {
      console.error('State token expired:', stateToken, 'expired at:', expiresAt);
      // Delete expired token
      await supabase.from('oauth_states').delete().eq('state_token', stateToken);
      throw new Error('OAuth session expired - please try connecting again');
    }

    const userId = stateData.user_id;
    console.log('Validated OAuth state for user:', userId);

    // Delete the state token immediately to prevent replay attacks
    await supabase.from('oauth_states').delete().eq('state_token', stateToken);

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
      const errorBody = await tokenResponse.text();
      console.error('Failed to exchange authorization code:', errorBody);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Calculate token expiry
    const expiryDate = new Date(Date.now() + expires_in * 1000);

    // Store tokens in profiles table using validated user_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendar_token: access_token,
        google_calendar_refresh_token: refresh_token,
        google_calendar_token_expiry: expiryDate.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error storing tokens:', updateError);
      throw new Error('Failed to store calendar tokens');
    }

    console.log('Successfully stored Google Calendar tokens for user:', userId);

    // Redirect back to app with success message
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appOrigin}?calendar_connected=true`,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://showpro-gig-flow.lovable.app';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appOrigin}?error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
