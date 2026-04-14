CREATE TABLE IF NOT EXISTS public.leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);

CREATE TABLE IF NOT EXISTS public.shipments (
  id BIGSERIAL PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  location TEXT,
  current_status TEXT NOT NULL DEFAULT 'Создан',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipments_tracking_number_idx ON public.shipments (tracking_number);
