import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadReportRequest {
  title: string;
  description: string;
  project_location: string;
  report_data: Record<string, any>;
  files?: File[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const formData = await req.formData();
    const reportData = JSON.parse(formData.get('reportData') as string) as UploadReportRequest;
    const files = formData.getAll('files') as File[];

    console.log('Uploading report for user:', user.id);
    console.log('Report data:', reportData);

    // Upload files to Supabase Storage
    const fileUrls: string[] = [];
    for (const file of files) {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('mrv-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      const { data: { publicUrl } } = supabaseClient.storage
        .from('mrv-files')
        .getPublicUrl(fileName);
      
      fileUrls.push(publicUrl);
    }

    // Save report metadata to database
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        user_id: user.id,
        title: reportData.title,
        description: reportData.description,
        project_location: reportData.project_location,
        report_data: reportData.report_data,
        file_urls: fileUrls,
        status: 'pending'
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report creation error:', reportError);
      throw new Error('Failed to create report');
    }

    console.log('Report created successfully:', report.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: report.id,
        message: 'Report uploaded successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload report error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});