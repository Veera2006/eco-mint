import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  report_id: string;
}

interface AIValidationResponse {
  status: 'validated' | 'rejected';
  estimated_sequestration: number;
  confidence_score: number;
  validation_notes: string;
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

    const { report_id }: ValidationRequest = await req.json();

    console.log('Validating report:', report_id);

    // Get report data
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // Update report status to validating
    await supabaseClient
      .from('reports')
      .update({ status: 'validating' })
      .eq('id', report_id);

    // Simulate AI validation (in production, call FastAPI ML service)
    const mockValidation: AIValidationResponse = {
      status: Math.random() > 0.3 ? 'validated' : 'rejected',
      estimated_sequestration: Math.round((Math.random() * 2000 + 500) * 100) / 100,
      confidence_score: Math.floor(Math.random() * 30 + 70),
      validation_notes: 'AI validation completed. Data quality assessment passed.'
    };

    // In production, uncomment this to call actual ML service:
    /*
    const mlResponse = await fetch('YOUR_ML_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        report_data: report.report_data,
        file_urls: report.file_urls
      })
    });
    
    const mockValidation: AIValidationResponse = await mlResponse.json();
    */

    // Update report with validation results
    const { data: updatedReport, error: updateError } = await supabaseClient
      .from('reports')
      .update({
        status: mockValidation.status,
        estimated_sequestration: mockValidation.estimated_sequestration,
        ai_confidence_score: mockValidation.confidence_score,
        validation_notes: mockValidation.validation_notes
      })
      .eq('id', report_id)
      .select()
      .single();

    if (updateError) {
      console.error('Report update error:', updateError);
      throw new Error('Failed to update report');
    }

    console.log('Report validation completed:', report_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: updatedReport,
        validation: mockValidation
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validate report error:', error);
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