import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlobalAnalytics {
  reports: {
    total: number;
    by_status: Record<string, number>;
    total_sequestration: number;
    average_confidence: number;
  };
  tokens: {
    total_minted: number;
    total_value: number;
    unique_holders: number;
  };
  governance: {
    total_approvals: number;
    approval_rate: number;
    active_validators: number;
  };
  trends: {
    monthly_reports: Array<{ month: string; count: number; sequestration: number }>;
    top_projects: Array<{ location: string; sequestration: number; reports: number }>;
  };
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

    console.log('Fetching global analytics...');

    // Get reports analytics
    const { data: reports, error: reportsError } = await supabaseClient
      .from('reports')
      .select('status, estimated_sequestration, ai_confidence_score, project_location, created_at');

    if (reportsError) {
      throw new Error('Failed to fetch reports data');
    }

    // Get carbon tokens analytics
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('carbon_tokens')
      .select('token_amount, user_id');

    if (tokensError) {
      throw new Error('Failed to fetch tokens data');
    }

    // Get governance approvals analytics
    const { data: approvals, error: approvalsError } = await supabaseClient
      .from('governance_approvals')
      .select('status, approver_id');

    if (approvalsError) {
      throw new Error('Failed to fetch approvals data');
    }

    // Calculate analytics
    const reportsAnalytics = {
      total: reports?.length || 0,
      by_status: reports?.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      total_sequestration: reports?.reduce((sum, report) => 
        sum + (report.estimated_sequestration || 0), 0) || 0,
      average_confidence: reports?.length ? 
        (reports.reduce((sum, report) => sum + (report.ai_confidence_score || 0), 0) / reports.length) : 0
    };

    const tokensAnalytics = {
      total_minted: tokens?.length || 0,
      total_value: tokens?.reduce((sum, token) => sum + (token.token_amount || 0), 0) || 0,
      unique_holders: new Set(tokens?.map(token => token.user_id)).size || 0
    };

    const governanceAnalytics = {
      total_approvals: approvals?.length || 0,
      approval_rate: approvals?.length ? 
        (approvals.filter(a => a.status === 'approved').length / approvals.length * 100) : 0,
      active_validators: new Set(approvals?.map(approval => approval.approver_id)).size || 0
    };

    // Calculate trends (last 12 months)
    const monthlyTrends = reports?.reduce((acc, report) => {
      const month = new Date(report.created_at).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, sequestration: 0 };
      }
      acc[month].count++;
      acc[month].sequestration += report.estimated_sequestration || 0;
      return acc;
    }, {} as Record<string, { count: number; sequestration: number }>) || {};

    const monthly_reports = Object.entries(monthlyTrends)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Top projects by location
    const projectTrends = reports?.reduce((acc, report) => {
      const location = report.project_location;
      if (!acc[location]) {
        acc[location] = { sequestration: 0, reports: 0 };
      }
      acc[location].sequestration += report.estimated_sequestration || 0;
      acc[location].reports++;
      return acc;
    }, {} as Record<string, { sequestration: number; reports: number }>) || {};

    const top_projects = Object.entries(projectTrends)
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.sequestration - a.sequestration)
      .slice(0, 10); // Top 10 projects

    const analytics: GlobalAnalytics = {
      reports: reportsAnalytics,
      tokens: tokensAnalytics,
      governance: governanceAnalytics,
      trends: {
        monthly_reports,
        top_projects
      }
    };

    console.log('Global analytics calculated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analytics: analytics,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Global analytics error:', error);
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