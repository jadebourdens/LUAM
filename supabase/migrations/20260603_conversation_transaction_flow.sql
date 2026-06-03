-- Transaction flow: conversation status + agreed_price
-- Conversations: add status & agreed_price
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'accepted', 'waiting_for_verification', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS agreed_price DECIMAL(12,2);

-- Profiles: add bank details for VND transfer
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- RLS: allow conversation participants to update status/agreed_price
CREATE POLICY IF NOT EXISTS "Participants can update conversation status"
  ON public.conversations
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
