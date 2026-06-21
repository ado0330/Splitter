-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own groups" ON groups;
DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;
DROP POLICY IF EXISTS "Users can delete own groups" ON groups;

DROP POLICY IF EXISTS "Users can view members of own groups" ON members;
DROP POLICY IF EXISTS "Users can insert members to own groups" ON members;
DROP POLICY IF EXISTS "Users can update members of own groups" ON members;
DROP POLICY IF EXISTS "Users can delete members of own groups" ON members;

DROP POLICY IF EXISTS "Users can view expenses of own groups" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses to own groups" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses of own groups" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses of own groups" ON expenses;

-- Create robust ALL policies
CREATE POLICY "Enable all access for own groups" 
ON groups FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable all access for own members" 
ON members FOR ALL 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = members.group_id AND groups.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE groups.id = members.group_id AND groups.user_id = auth.uid()));

CREATE POLICY "Enable all access for own expenses" 
ON expenses FOR ALL 
USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = expenses.group_id AND groups.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM groups WHERE groups.id = expenses.group_id AND groups.user_id = auth.uid()));
