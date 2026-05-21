ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS deleted TEXT DEFAULT 'no';

-- Atualiza políticas de RLS para garantir que a coluna seja respeitada se necessário
-- (Geralmente as queries já filtram, mas é boa prática ter no DB)