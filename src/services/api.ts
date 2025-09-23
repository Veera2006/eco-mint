import { supabase } from '@/integrations/supabase/client';

// Helper function to get authenticated headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
};

// API service class for Blue Carbon platform
export class BlueCarbonAPI {
  
  // Authentication methods
  static async register(email: string, password: string, userData?: any) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: userData
      }
    });
  }

  static async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  static async logout() {
    return await supabase.auth.signOut();
  }

  // Profile management
  static async getUserProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();
    return { data, error };
  }

  static async updateUserProfile(updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .select()
      .single();
    return { data, error };
  }

  // Reports management
  static async uploadReport(reportData: any, files: File[]) {
    const formData = new FormData();
    formData.append('reportData', JSON.stringify(reportData));
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    return await supabase.functions.invoke('upload-report', {
      body: formData,
    });
  }

  static async getReports() {
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
    
    return { data, error };
  }

  static async getReportById(id: string) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        profiles:user_id (
          full_name,
          organization,
          role
        ),
        carbon_tokens (*),
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
    
    return { data, error };
  }

  static async validateReport(reportId: string) {
    return await supabase.functions.invoke('validate-report', {
      body: { report_id: reportId },
    });
  }

  // Token management
  static async mintCarbonToken(reportId: string, walletAddress: string) {
    return await supabase.functions.invoke('mint-carbon-token', {
      body: { 
        report_id: reportId,
        wallet_address: walletAddress 
      },
    });
  }

  static async getUserTokens() {
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
    
    return { data, error };
  }

  // Governance methods
  static async submitGovernanceApproval(
    reportId: string, 
    status: 'approved' | 'rejected', 
    approvalNotes?: string,
    signature?: string
  ) {
    return await supabase.functions.invoke('governance-approve', {
      body: {
        report_id: reportId,
        status,
        approval_notes: approvalNotes,
        signature
      },
    });
  }

  static async getPendingApprovals() {
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
    
    return { data, error };
  }

  // Analytics methods
  static async getGlobalAnalytics() {
    return await supabase.functions.invoke('analytics-global');
  }

  static async getDashboardMetrics() {
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

    return {
      data: {
        totalReports: reports.length,
        totalTokens: tokens.reduce((sum, token) => sum + (token.token_amount || 0), 0),
        pendingValidations: reports.filter(r => r.status === 'pending').length,
        activeValidators: new Set(approvals.map(a => a.approver_id)).size,
        averageConfidence: reports.length > 0 
          ? reports.reduce((sum, r) => sum + (r.ai_confidence_score || 0), 0) / reports.length 
          : 0,
        totalSequestration: reports.reduce((sum, r) => sum + (r.estimated_sequestration || 0), 0),
      },
      error: null
    };
  }

  // File upload helpers
  static async uploadFile(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('mrv-files')
      .upload(path, file);
    
    return { data, error };
  }

  static async getFileUrl(path: string) {
    const { data } = supabase.storage
      .from('mrv-files')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}

export default BlueCarbonAPI;