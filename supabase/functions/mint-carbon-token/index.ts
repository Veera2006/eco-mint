import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MintTokenRequest {
  report_id: string;
  wallet_address: string;
}

interface BlockchainMintResponse {
  success: boolean;
  transaction_hash: string;
  contract_address: string;
  block_number: number;
  token_amount: number;
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

    const { report_id, wallet_address }: MintTokenRequest = await req.json();

    console.log('Minting carbon token for report:', report_id);

    // Get validated report
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .eq('user_id', user.id)
      .eq('status', 'validated')
      .single();

    if (reportError || !report) {
      throw new Error('Validated report not found');
    }

    // Check governance approvals (require at least 2 approvals)
    const { data: approvals, error: approvalsError } = await supabaseClient
      .from('governance_approvals')
      .select('*')
      .eq('report_id', report_id)
      .eq('status', 'approved');

    if (approvalsError) {
      throw new Error('Failed to check governance approvals');
    }

    if (!approvals || approvals.length < 2) {
      throw new Error('Insufficient governance approvals. Need at least 2 approvals.');
    }

    // Simulate blockchain token minting (in production, use ethers.js)
    const mockMinting: BlockchainMintResponse = {
      success: true,
      transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
      contract_address: '0x742d35Cc7bF58E06B14e2A6A5C6e75e2A86c1c63',
      block_number: Math.floor(Math.random() * 1000000 + 18000000),
      token_amount: report.estimated_sequestration || 0
    };

    // Production blockchain integration (uncomment when contracts are deployed):
    /*
    const { ethers } = await import('https://esm.sh/ethers@6.8.0');
    
    const POLYGON_RPC_URL = Deno.env.get('POLYGON_RPC_URL');
    const PRIVATE_KEY = Deno.env.get('PRIVATE_KEY'); 
    const CARBON_TOKEN_ADDRESS = Deno.env.get('CARBON_TOKEN_ADDRESS');
    
    if (POLYGON_RPC_URL && PRIVATE_KEY && CARBON_TOKEN_ADDRESS) {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      
      // Carbon Token ABI (minimal for minting)
      const CARBON_TOKEN_ABI = [
        "function mintCarbonToken(address recipient, uint256 sequestrationAmount, string reportId, string projectLocation) returns (uint256)"
      ];
      
      const contract = new ethers.Contract(CARBON_TOKEN_ADDRESS, CARBON_TOKEN_ABI, wallet);
      
      const tx = await contract.mintCarbonToken(
        wallet_address,
        report.estimated_sequestration,
        report_id,
        report.project_location || 'Blue Carbon Project'
      );
      
      const receipt = await tx.wait();
      const mockMinting = {
        success: true,
        transaction_hash: receipt.hash,
        contract_address: CARBON_TOKEN_ADDRESS,
        block_number: receipt.blockNumber,
        token_amount: report.estimated_sequestration
      };
    } else {
      // Fallback to mock if secrets not configured
      console.log('Blockchain secrets not configured, using mock minting');
    }
    */

    // Save carbon token record
    const { data: carbonToken, error: tokenError } = await supabaseClient
      .from('carbon_tokens')
      .insert({
        report_id: report_id,
        user_id: user.id,
        token_amount: mockMinting.token_amount,
        contract_address: mockMinting.contract_address,
        transaction_hash: mockMinting.transaction_hash,
        block_number: mockMinting.block_number,
        token_metadata: {
          report_title: report.title,
          project_location: report.project_location,
          sequestration_amount: report.estimated_sequestration,
          minted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Token record error:', tokenError);
      throw new Error('Failed to save token record');
    }

    // Update report status to minted
    await supabaseClient
      .from('reports')
      .update({ status: 'minted' })
      .eq('id', report_id);

    console.log('Carbon token minted successfully:', carbonToken.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        carbon_token: carbonToken,
        blockchain_result: mockMinting
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mint carbon token error:', error);
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