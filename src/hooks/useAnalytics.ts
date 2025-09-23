import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GlobalAnalytics {
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

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGlobalAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analytics-global');

      if (error) throw error;

      setAnalytics(data.analytics);
      return { data: data.analytics, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to fetch analytics",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_tokens')
        .select(`
          *,
          reports (
            title,
            project_location,
            estimated_sequestration
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to fetch user tokens",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      // Fetch multiple metrics in parallel
      const [reportsResult, tokensResult, approvalsResult] = await Promise.all([
        supabase.from('reports').select('status, estimated_sequestration, ai_confidence_score'),
        supabase.from('carbon_tokens').select('token_amount'),
        supabase.from('governance_approvals').select('status, approver_id'),
      ]);

      if (reportsResult.error) throw reportsResult.error;
      if (tokensResult.error) throw tokensResult.error;
      if (approvalsResult.error) throw approvalsResult.error;

      const reports = reportsResult.data || [];
      const tokens = tokensResult.data || [];
      const approvals = approvalsResult.data || [];

      const metrics = {
        totalReports: reports.length,
        totalTokens: tokens.reduce((sum, token) => sum + (token.token_amount || 0), 0),
        pendingValidations: reports.filter(r => r.status === 'pending').length,
        activeValidators: new Set(approvals.map(a => a.approver_id)).size,
        averageConfidence: reports.length > 0 
          ? reports.reduce((sum, r) => sum + (r.ai_confidence_score || 0), 0) / reports.length 
          : 0,
        totalSequestration: reports.reduce((sum, r) => sum + (r.estimated_sequestration || 0), 0),
      };

      return { data: metrics, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to fetch dashboard metrics",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  // Auto-fetch analytics on hook initialization
  useEffect(() => {
    fetchGlobalAnalytics();
  }, []);

  return {
    analytics,
    loading,
    fetchGlobalAnalytics,
    fetchUserTokens,
    fetchDashboardMetrics,
  };
};