-- =====================================================================
-- i18n support for foods
--   * name_ja / name_es : dedicated localized name columns
--     (parallel to existing name_ko / name_en)
--   * translations jsonb : localized descriptions keyed by locale code,
--     e.g. { "en": "...", "ja": "...", "es": "..." }.
--     The base `description` column remains the Korean (default) text.
-- =====================================================================

alter table public.foods
  add column if not exists name_ja      text,
  add column if not exists name_es      text,
  add column if not exists translations jsonb not null default '{}'::jsonb;
