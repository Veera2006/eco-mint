-- Create enum types for report status and governance status
CREATE TYPE public.report_status AS ENUM ('pending', 'validating', 'validated', 'rejected', 'minted');
CREATE TYPE public.governance_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.user_role AS ENUM ('admin', 'validator', 'ngo', 'community');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  role user_role NOT NULL DEFAULT 'community',
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table for MRV data
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_location TEXT NOT NULL,
  report_data JSONB NOT NULL,
  file_urls TEXT[],
  ipfs_hash TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  estimated_sequestration DECIMAL(10,2),
  ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create carbon_tokens table for minted tokens
CREATE TABLE public.carbon_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_amount DECIMAL(10,2) NOT NULL,
  contract_address TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  token_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create governance_approvals table for multi-sig approvals
CREATE TABLE public.governance_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status governance_status NOT NULL DEFAULT 'pending',
  approval_notes TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_id, approver_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for reports
CREATE POLICY "Users can view their own reports" 
ON public.reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.reports FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins and validators can view all reports
CREATE POLICY "Admins and validators can view all reports" 
ON public.reports FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'validator')
  )
);

-- Create RLS policies for carbon tokens
CREATE POLICY "Users can view their own tokens" 
ON public.carbon_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create tokens" 
ON public.carbon_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for governance approvals
CREATE POLICY "Users can view governance approvals for their reports" 
ON public.governance_approvals FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reports 
    WHERE id = report_id AND user_id = auth.uid()
  )
);

CREATE POLICY "NGO users can create approvals" 
ON public.governance_approvals FOR INSERT 
WITH CHECK (
  auth.uid() = approver_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ngo', 'admin')
  )
);

CREATE POLICY "NGO users can update their approvals" 
ON public.governance_approvals FOR UPDATE 
USING (
  auth.uid() = approver_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('ngo', 'admin')
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_approvals_updated_at
  BEFORE UPDATE ON public.governance_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for MRV files
INSERT INTO storage.buckets (id, name, public) VALUES ('mrv-files', 'mrv-files', false);

-- Create storage policies for MRV files
CREATE POLICY "Users can upload their own MRV files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'mrv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own MRV files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'mrv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all MRV files" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'mrv-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_carbon_tokens_user_id ON public.carbon_tokens(user_id);
CREATE INDEX idx_carbon_tokens_report_id ON public.carbon_tokens(report_id);
CREATE INDEX idx_governance_approvals_report_id ON public.governance_approvals(report_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);