-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core user profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members (Participants in a group)
CREATE TABLE members (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payer_id UUID REFERENCES members(id) ON DELETE SET NULL,
  split_type TEXT, -- 'EQUAL', 'CUSTOM', 'ITEMIZED'
  additional_charges_mode TEXT,
  service_charge_pct NUMERIC,
  tax_pct NUMERIC,
  extra_charges_amount NUMERIC,
  is_payment BOOLEAN DEFAULT FALSE,
  
  -- JSONB is excellent here for custom amounts and receipt items 
  participant_ids JSONB,      -- Array of member UUIDs
  custom_amounts JSONB,       -- Record<member_id, amount>
  base_custom_amounts JSONB,  -- Record<member_id, expression_string>
  receipt_items JSONB,        -- Array of ReceiptItem objects
  
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read and update their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Groups: Users can only access their own groups
CREATE POLICY "Users can view own groups" 
ON groups FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own groups" 
ON groups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups" 
ON groups FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own groups" 
ON groups FOR DELETE 
USING (auth.uid() = user_id);

-- Members: Users can access members of their own groups
CREATE POLICY "Users can view members of own groups" 
ON members FOR SELECT 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = members.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Users can insert members to own groups" 
ON members FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE groups.id = members.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Users can update members of own groups" 
ON members FOR UPDATE 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = members.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Users can delete members of own groups" 
ON members FOR DELETE 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = members.group_id AND groups.user_id = auth.uid()));

-- Expenses: Users can access expenses of their own groups
CREATE POLICY "Users can view expenses of own groups" 
ON expenses FOR SELECT 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = expenses.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Users can insert expenses to own groups" 
ON expenses FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE groups.id = expenses.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Users can update expenses of own groups" 
ON expenses FOR UPDATE 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = expenses.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Users can delete expenses of own groups" 
ON expenses FOR DELETE 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = expenses.group_id AND groups.user_id = auth.uid()));

-- Set up Realtime for syncing
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table expenses;
