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
    const { bookingId, action, authHeader } = await req.json();

    // Get secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check for existing token
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_token, google_calendar_refresh_token, google_calendar_token_expiry')
      .eq('id', user.id)
      .single();

    // If importing calendar events
    if (action === 'import') {
      if (!profile?.google_calendar_token) {
        throw new Error('No Google Calendar token found. Please connect your calendar first.');
      }

      // Fetch booking to check overlaps
      const { data: booking } = await supabase
        .from('bookings')
        .select('start_date, finish_date, booking_date')
        .eq('id', bookingId)
        .single();

      if (!booking) throw new Error('Booking not found');

      // Fetch events from Google Calendar
      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date(Date.now() - 30*24*60*60*1000).toISOString()}&timeMax=${new Date(Date.now() + 365*24*60*60*1000).toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${profile.google_calendar_token}` }
        }
      );

      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const { items: events } = await eventsResponse.json();
      
      // Check for overlaps
      const bookingStart = new Date(booking.start_date || booking.booking_date);
      const bookingEnd = new Date(booking.finish_date || booking.booking_date);
      
      const clashes = events.filter((event: any) => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return eventStart < bookingEnd && eventEnd > bookingStart;
      });

      console.log('Found', clashes.length, 'clashes for booking:', bookingId);

      return new Response(
        JSON.stringify({ clashes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If exporting to Google Calendar
    if (action === 'export') {
      if (!profile?.google_calendar_token) {
        // Return OAuth URL
        const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`;
        const scope = 'https://www.googleapis.com/auth/calendar.events';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${user.id}`;

        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch booking and create calendar event
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          artists(name),
          clients(name),
          venues(name),
          locations(name)
        `)
        .eq('id', bookingId)
        .single();

      if (!booking) throw new Error('Booking not found');

      const eventStart = new Date(booking.booking_date);
      if (booking.start_time) {
        const [hours, minutes] = booking.start_time.split(':');
        eventStart.setHours(parseInt(hours), parseInt(minutes));
      }

      const eventEnd = booking.finish_date ? new Date(booking.finish_date) : new Date(booking.booking_date);
      if (booking.finish_time) {
        const [hours, minutes] = booking.finish_time.split(':');
        eventEnd.setHours(parseInt(hours), parseInt(minutes));
      }

      const calendarEvent = {
        summary: `${booking.artists?.name || 'Booking'} - ${booking.locations?.name || booking.clients?.name}`,
        description: booking.notes || '',
        start: { dateTime: eventStart.toISOString(), timeZone: 'Europe/London' },
        end: { dateTime: eventEnd.toISOString(), timeZone: 'Europe/London' },
        location: booking.venues?.name || booking.locations?.name || ''
      };

      const createResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${profile.google_calendar_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(calendarEvent)
        }
      );

      if (!createResponse.ok) {
        throw new Error('Failed to create calendar event');
      }

      console.log('Created Google Calendar event for booking:', bookingId);

      return new Response(
        JSON.stringify({ success: true, message: 'Event added to Google Calendar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error with Google sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
