CREATE TABLE IF NOT EXISTS public.material_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

ALTER TABLE public.material_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own material completions" ON public.material_completions;
CREATE POLICY "Users can view own material completions" 
ON public.material_completions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own material completions" ON public.material_completions;
CREATE POLICY "Users can insert own material completions" 
ON public.material_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);
