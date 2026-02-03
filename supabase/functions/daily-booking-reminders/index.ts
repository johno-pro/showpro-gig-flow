import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

// Use specific allowed origins instead of wildcard for security
const getAllowedOrigin = (requestOrigin: string | null) => {
  const allowedOrigins = [
    'https://showpro-gig-flow.lovable.app',
    'https://id-preview--fd264bf6-2729-4721-a3be-d4e3204fa0f5.lovable.app',
    Deno.env.get('APP_ORIGIN'),
  ].filter(Boolean);
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0] || 'https://showpro-gig-flow.lovable.app';
};

const getCorsHeaders = (requestOrigin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
});

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Create client for auth check using anon key
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Check if user has admin or manager role
    const { data: roles, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !roles || roles.length === 0) {
      console.error('Failed to fetch user roles:', roleError?.message);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Unable to verify permissions' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    const hasPermission = roles.some(r => r.role === 'admin' || r.role === 'manager');
    if (!hasPermission) {
      console.warn(`User ${user.id} attempted to access reminders without proper role`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    console.log(`Authenticated user ${user.email} (${user.id}) triggered reminder check`);

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting daily booking reminders check...')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // 1. Check for deposit reminders (7 days before event)
    const { data: depositReminders, error: depositError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        description,
        client_id,
        clients!inner(name, contact_email)
      `)
      .eq('deposit_paid', false)
      .gte('start_date', sevenDaysFromNow.toISOString().split('T')[0])
      .lt('start_date', new Date(sevenDaysFromNow.getTime() + 86400000).toISOString().split('T')[0])

    if (depositError) {
      console.error('Error fetching deposit reminders:', depositError)
    } else {
      console.log(`Found ${depositReminders?.length || 0} bookings requiring deposit reminders`)
      
      for (const booking of depositReminders || []) {
        const client = booking.clients as any
        const { error: insertError } = await supabase
          .from('emails_queue')
          .insert({
            booking_id: booking.id,
            recipient_type: 'client',
            email_subject: `Deposit Payment Reminder - ${booking.description}`,
            email_body: `Dear ${client.name},\n\nThis is a reminder that your booking "${booking.description}" is scheduled for ${new Date(booking.start_date).toLocaleDateString()} (7 days from now).\n\nThe deposit payment is still outstanding. Please arrange payment at your earliest convenience.\n\nThank you.`,
            approved_to_send: false,
            sent: false
          })

        if (insertError) {
          console.error(`Error queuing deposit reminder for booking ${booking.id}:`, insertError)
        } else {
          console.log(`Queued deposit reminder for booking ${booking.id}`)
        }
      }
    }

    // 2. Check for post-event invoice/balance reminders
    const { data: balanceReminders, error: balanceError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        description,
        balance_paid,
        invoiced,
        client_id,
        clients!inner(name, contact_email)
      `)
      .lt('start_date', today.toISOString().split('T')[0])
      .or('balance_paid.eq.false,invoiced.eq.false')

    if (balanceError) {
      console.error('Error fetching balance reminders:', balanceError)
    } else {
      console.log(`Found ${balanceReminders?.length || 0} bookings requiring balance/invoice reminders`)
      
      for (const booking of balanceReminders || []) {
        // Check if we already sent a reminder for this booking recently (within last 7 days)
        const { data: existingReminder } = await supabase
          .from('emails_queue')
          .select('id, created_at')
          .eq('booking_id', booking.id)
          .eq('recipient_type', 'client')
          .ilike('email_subject', '%balance%invoice%')
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .limit(1)

        if (existingReminder && existingReminder.length > 0) {
          console.log(`Skipping booking ${booking.id} - reminder already sent recently`)
          continue
        }

        const client = booking.clients as any
        const issues = []
        if (!booking.balance_paid) issues.push('balance payment')
        if (!booking.invoiced) issues.push('invoice')
        
        const { error: insertError } = await supabase
          .from('emails_queue')
          .insert({
            booking_id: booking.id,
            recipient_type: 'client',
            email_subject: `Payment & Invoice Reminder - ${booking.description}`,
            email_body: `Dear ${client.name},\n\nYour booking "${booking.description}" took place on ${new Date(booking.start_date).toLocaleDateString()}.\n\nWe note that the following items are still outstanding:\n${issues.map(i => `- ${i.charAt(0).toUpperCase() + i.slice(1)}`).join('\n')}\n\nPlease arrange for ${issues.join(' and ')} at your earliest convenience.\n\nThank you.`,
            approved_to_send: false,
            sent: false
          })

        if (insertError) {
          console.error(`Error queuing balance reminder for booking ${booking.id}:`, insertError)
        } else {
          console.log(`Queued balance/invoice reminder for booking ${booking.id}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        depositReminders: depositReminders?.length || 0,
        balanceReminders: balanceReminders?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in daily-booking-reminders:', error)
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
