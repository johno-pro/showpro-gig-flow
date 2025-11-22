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
    const { bookingId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch booking with all related data
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

    // Calculate buffer times
    const venueBuffer = booking.venues?.buffer_hours || 1;
    const venuePre = booking.venues?.pre_multiplier || 1;
    const venuePost = booking.venues?.post_multiplier || 1;
    const gigPre = booking.gig_types?.pre_multiplier || 1;
    const gigPost = booking.gig_types?.post_multiplier || 1;
    const artistPre = booking.artists?.pre_multiplier || 1;
    const artistPost = booking.artists?.post_multiplier || 1;

    const effectivePreBuffer = venueBuffer * venuePre * gigPre * artistPre;
    const effectivePostBuffer = venueBuffer * venuePost * gigPost * artistPost;

    // Parse dates (booking_date is the main date field)
    const startDate = new Date(booking.booking_date);
    if (booking.start_time) {
      const [hours, minutes] = booking.start_time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    }

    const endDate = booking.finish_date ? new Date(booking.finish_date) : new Date(booking.booking_date);
    if (booking.finish_time) {
      const [hours, minutes] = booking.finish_time.split(':');
      endDate.setHours(parseInt(hours), parseInt(minutes), 0);
    } else if (booking.end_time) {
      const [hours, minutes] = booking.end_time.split(':');
      endDate.setHours(parseInt(hours), parseInt(minutes), 0);
    }

    // Apply buffers
    const bufferedStart = new Date(startDate.getTime() - effectivePreBuffer * 60 * 60 * 1000);
    const bufferedEnd = new Date(endDate.getTime() + effectivePostBuffer * 60 * 60 * 1000);

    // Format dates for iCal (UTC format)
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Calculate split ratio
    const artistFee = booking.artist_fee || 0;
    const clientFee = booking.client_fee || 0;
    const total = clientFee || (artistFee + clientFee);
    const splitRatio = total > 0 ? Math.round((artistFee / total) * 100) : 0;

    // Build description
    const description = [
      `Rate: £${clientFee.toFixed(2)}`,
      `Split: ${splitRatio}/${100 - splitRatio}`,
      booking.notes ? `Notes: ${booking.notes}` : ''
    ].filter(Boolean).join(' | ');

    // Generate iCal content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ShowPro//Entertainment Bookings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:booking-${bookingId}@showpro.uk`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(bufferedStart)}`,
      `DTEND:${formatICalDate(bufferedEnd)}`,
      `SUMMARY:${booking.artists?.name || 'Booking'} - ${booking.locations?.name || booking.clients?.name || 'Gig'}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${booking.venues?.name || booking.locations?.name || ''}`,
      `STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    console.log('Generated iCal for booking:', bookingId);

    return new Response(
      JSON.stringify({ icsContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating iCal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
