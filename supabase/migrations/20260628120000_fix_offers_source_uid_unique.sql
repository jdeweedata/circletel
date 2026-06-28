-- supabase/migrations/20260628120000_fix_offers_source_uid_unique.sql
-- Fix: the Offer Spine migration created a PARTIAL unique index on offers.source_uid
-- (WHERE source_uid IS NOT NULL). Postgres cannot use a partial index as an
-- ON CONFLICT arbiter, so publisher.persistOfferDraft (upsert onConflict: 'source_uid')
-- failed with "no unique or exclusion constraint matching the ON CONFLICT specification".
--
-- A plain (non-partial) unique index on a nullable column already permits multiple NULL
-- source_uid rows (manual, non-source offers) because SQL treats NULLs as distinct, so the
-- WHERE predicate was redundant. Replace it with a non-partial unique index of the same name.

DROP INDEX IF EXISTS public.offers_source_uid_key;

CREATE UNIQUE INDEX IF NOT EXISTS offers_source_uid_key
  ON public.offers (source_uid);
