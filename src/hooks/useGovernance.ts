import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGovernance = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitApproval = async (
    reportId: string, 
    status: 'approved' | 'rejected', 
    approvalNotes?: string,
    signature?: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('governance-approve', {
        body: {
          report_id: reportId,
          status,
          approval_notes: approvalNotes,
          signature
        },
      });

      if (error) throw error;

      toast({
        title: `Report ${status}`,
        description: `Your governance ${status === 'approved' ? 'approval' : 'rejection'} has been recorded.`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Governance action failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:user_id (
            full_name,
            organization
          ),
          governance_approvals (
            id,
            status,
            approval_notes,
            profiles:approver_id (
              full_name,
              organization
            )
          )
        `)
        .eq('status', 'validated')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to fetch pending approvals",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const getApprovalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('governance_approvals')
        .select(`
          *,
          reports (
            title,
            project_location,
            estimated_sequestration
          ),
          profiles:approver_id (
            full_name,
            organization,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to fetch approval history",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  return {
    loading,
    submitApproval,
    getPendingApprovals,
    getApprovalHistory,
  };
};