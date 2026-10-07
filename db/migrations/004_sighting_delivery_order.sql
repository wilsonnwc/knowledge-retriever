-- "Everything else" grouped by newsletter, oldest email first (user decision, 2026-10-07).
--   received_at — when the email that linked the item that day was sent (its Date header)
--   position    — the item's place in that night's run, so a newsletter keeps its own order
-- Both nullable: days stored before this migration have neither, and fall back to newsletter name, then title.
ALTER TABLE sightings ADD COLUMN received_at TIMESTAMPTZ;
ALTER TABLE sightings ADD COLUMN position    INTEGER;
