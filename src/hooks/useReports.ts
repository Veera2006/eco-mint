import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReportData {
  title: string;
  description: string;
  project_location: string;
  report_data: Record<string, any>;
}

export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const uploadReport = async (reportData: ReportData, files: File[]) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reportData', JSON.stringify(reportData));
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      const { data, error } = await supabase.functions.invoke('upload-report', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Report uploaded successfully",
        description: "Your MRV report has been uploaded and is pending validation.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const validateReport = async (reportId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-report', {
        body: { report_id: reportId },
      });

      if (error) throw error;

      toast({
        title: "Validation initiated",
        description: "AI validation has been started for your report.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Validation failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const mintCarbonToken = async (reportId: string, walletAddress: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-carbon-token', {
        body: { 
          report_id: reportId,
          wallet_address: walletAddress 
        },
      });

      if (error) throw error;

      toast({
        title: "Token minting successful",
        description: "Your carbon credit tokens have been minted on the blockchain!",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Minting failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:user_id (
            full_name,
            organization
          ),
          carbon_tokens (
            id,
            token_amount,
            transaction_hash
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Failed to fetch reports",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const getReportById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:user_id (
            full_name,
            organization,
            role
          ),
          carbon_tokens (
            *
          ),
          governance_approvals (
            *,
            profiles:approver_id (
              full_name,
              organization,
              role
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  return {
    loading,
    uploadReport,
    validateReport,
    mintCarbonToken,
    getReports,
    getReportById,
  };
};