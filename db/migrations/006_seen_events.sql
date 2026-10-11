-- "Seen" impressions (user decisions, 2026-10-11; spec system/specs/2026-10-11-seen-impressions.md).
--   seen — a Today-tab card was at least half visible for at least 1 second (or pressed/opened). Lets the ranking
--   review tell "seen, not pressed" (a weak negative) from "never reached" (no signal). Not a button press: it never
--   changes a card's status and can't be undone.
--   digest_date — which day's page it was seen on (any day, including catching up on older ones). With item_id it is
--   the key of `sightings`, so each impression joins to exactly one section/rank.
ALTER TABLE events DROP CONSTRAINT events_action_check;
ALTER TABLE events ADD CONSTRAINT events_action_check
    CHECK (action IN ('open', 'read', 'read_now', 'later', 'build', 'dismiss', 'undo', 'not_junk', 'seen'));
ALTER TABLE events ADD COLUMN digest_date DATE;
ALTER TABLE events ADD CONSTRAINT events_seen_has_page CHECK (action <> 'seen' OR digest_date IS NOT NULL);
-- One impression per card per page, guaranteed by the database (writers use ON CONFLICT DO NOTHING).
CREATE UNIQUE INDEX events_one_seen_per_page ON events (item_id, digest_date) WHERE action = 'seen';
