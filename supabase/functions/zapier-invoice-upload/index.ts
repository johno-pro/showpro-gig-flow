import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook authentication
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = Deno.env.get('ZAPIER_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('ZAPIER_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook authentication not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn('Unauthorized webhook access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Zapier webhook triggered - authenticated');

    // Parse the incoming request
    const formData = await req.formData();
    const artistId = formData.get('artist_id') as string;
    const artistEmail = formData.get('artist_email') as string;
    const file = formData.get('file') as File;

    // Validate file exists
    if (!file) {
      console.error('No file uploaded');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type (only PDF, JPEG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes`);
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Request data:', { artistId, artistEmail, fileName: file.name, fileSize: file.size, mimeType: file.type });

    // Find artist by ID or email
    let artist;
    if (artistId) {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, email')
        .eq('id', artistId)
        .maybeSingle();

      if (error) {
        console.error('Error finding artist by ID:', error);
      }
      artist = data;
    }

    if (!artist && artistEmail) {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, email')
        .eq('email', artistEmail)
        .maybeSingle();

      if (error) {
        console.error('Error finding artist by email:', error);
      }
      artist = data;
    }

    if (!artist) {
      return new Response(
        JSON.stringify({ error: 'Artist not found. Please provide valid artist_id or artist_email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found artist:', artist);

    // Derive file extension from validated MIME type (more secure than parsing filename)
    const extensionMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png'
    };
    const fileExt = extensionMap[file.type];
    
    if (!fileExt) {
      console.error(`Unsupported MIME type: ${file.type}`);
      return new Response(
        JSON.stringify({ error: 'Unsupported file type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure filename using artist ID and timestamp
    const fileName = `${artist.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('artist-invoices')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File uploaded successfully:', filePath);

    // Store file path instead of public URL - signed URLs should be generated on demand
    // This ensures access requires authentication and URLs expire
    const { error: updateError } = await supabase
      .from('artists')
      .update({ invoice_upload_url: filePath })
      .eq('id', artist.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update artist record', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Artist updated successfully with file path (not public URL)');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice uploaded successfully',
        artist: {
          id: artist.id,
          name: artist.name,
        },
        file: {
          name: file.name,
          size: file.size,
          path: filePath, // Return path instead of URL for security
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in zapier-invoice-upload function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
