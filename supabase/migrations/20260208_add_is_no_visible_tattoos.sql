-- Add "No visible tattoos" checkbox to yacht_work_offers
-- Run in Supabase → SQL Editor

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS is_no_visible_tattoos boolean NOT NULL DEFAULT false;
