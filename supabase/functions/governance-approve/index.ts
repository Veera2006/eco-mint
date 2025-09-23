import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GovernanceApprovalRequest {
  report_id: string;
  status: 'approved' | 'rejected';
  approval_notes?: string;
  signature?: string;
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

    // Check if user has NGO or admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !['ngo', 'admin'].includes(profile.role)) {
      throw new Error('Unauthorized: NGO or admin role required');
    }

    const { report_id, status, approval_notes, signature }: GovernanceApprovalRequest = await req.json();

    console.log('Processing governance approval:', { report_id, status, user_id: user.id });

    // Check if report exists and is validated
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .eq('status', 'validated')
      .single();

    if (reportError || !report) {
      throw new Error('Validated report not found');
    }

    // Create or update governance approval
    const { data: approval, error: approvalError } = await supabaseClient
      .from('governance_approvals')
      .upsert({
        report_id: report_id,
        approver_id: user.id,
        status: status,
        approval_notes: approval_notes || '',
        signature: signature || ''
      })
      .select()
      .single();

    if (approvalError) {
      console.error('Approval error:', approvalError);
      throw new Error('Failed to process approval');
    }

    // Get all approvals for this report
    const { data: allApprovals, error: allApprovalsError } = await supabaseClient
      .from('governance_approvals')
      .select(`
        *,
        profiles:approver_id (
          full_name,
          organization,
          role
        )
      `)
      .eq('report_id', report_id);

    if (allApprovalsError) {
      console.error('All approvals error:', allApprovalsError);
      throw new Error('Failed to fetch all approvals');
    }

    const approvedCount = allApprovals?.filter(a => a.status === 'approved').length || 0;
    const rejectedCount = allApprovals?.filter(a => a.status === 'rejected').length || 0;
    const totalApprovals = allApprovals?.length || 0;

    console.log('Approval status:', { 
      approved: approvedCount, 
      rejected: rejectedCount, 
      total: totalApprovals 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        approval: approval,
        summary: {
          approved_count: approvedCount,
          rejected_count: rejectedCount,
          total_approvals: totalApprovals,
          ready_for_minting: approvedCount >= 2
        },
        all_approvals: allApprovals
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Governance approval error:', error);
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