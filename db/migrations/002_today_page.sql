-- Learning OS Phase 2a: what the Today page and the store-first pipeline need on top of 001.
-- Applied while items/events were empty (migrations are free until real button history exists).

-- An item is one piece of content (keyed by canonical URL, or message-id for an email body).
-- Its appearance in a given day's digest is a sighting, so a link repeated on a later day is
-- one card with history rather than a duplicate, and "Junk today" lists that day's junk.
ALTER TABLE items DROP CONSTRAINT items_kind_check;
ALTER TABLE items ADD CONSTRAINT items_kind_check CHECK (kind IN ('email_body', 'article', 'media', 'junk'));
ALTER TABLE items DROP COLUMN rank;            -- per day: moved to sightings
ALTER TABLE items DROP COLUMN why_it_ranks;    -- per day: moved to sightings
ALTER TABLE items ADD COLUMN message_id     TEXT;    -- RFC Message-ID of the email it came from
ALTER TABLE items ADD COLUMN class_reason   TEXT;    -- why it is junk/media/article: 'rule: …' or 'judge: …'
ALTER TABLE items ADD COLUMN heading        TEXT;    -- the newsletter's section heading
ALTER TABLE items ADD COLUMN context        TEXT;    -- the newsletter's own words around the link
ALTER TABLE items ADD COLUMN one_liner      TEXT;    -- first sentence of the summary, for compact rows
ALTER TABLE items ADD COLUMN read_time_min  INTEGER;
ALTER TABLE items ADD COLUMN last_seen_date DATE;

CREATE TABLE sightings (
    item_id       TEXT NOT NULL REFERENCES items (id),
    digest_date   DATE NOT NULL,
    source        TEXT NOT NULL,                 -- the newsletter that linked it that day
    email_subject TEXT,
    section       TEXT NOT NULL CHECK (section IN ('top', 'next', 'rest', 'junk')),
    rank          INTEGER,                       -- 1-3 top, 4-10 next
    why           TEXT,                          -- why it ranks here (top cards)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (item_id, digest_date)
);
CREATE INDEX sightings_date_idx ON sightings (digest_date DESC, section, rank);

-- The permanent fix for repeat emails: an email processed once is never processed again.
CREATE TABLE processed_messages (
    message_id   TEXT PRIMARY KEY,
    digest_date  DATE NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per pipeline run, so the page can say "Last updated" and failures are visible.
CREATE TABLE runs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    digest_date DATE NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    sent        BOOLEAN NOT NULL DEFAULT false,
    items       INTEGER,
    coverage    JSONB
);
CREATE INDEX runs_date_idx ON runs (digest_date DESC);

-- "Not junk" corrections from the Junk today list (each becomes a junk-judge eval case).
ALTER TABLE events DROP CONSTRAINT events_action_check;
ALTER TABLE events ADD CONSTRAINT events_action_check
    CHECK (action IN ('open', 'read_now', 'later', 'build', 'dismiss', 'undo', 'not_junk'));
