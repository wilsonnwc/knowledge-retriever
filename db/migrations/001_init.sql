-- Learning OS Phase 2: items (the content supply) and events (the append-only click log).

CREATE TABLE items (
    id               TEXT PRIMARY KEY,  -- stable fingerprint: canonical article URL, or newsletter + subject for email bodies
    digest_date      DATE NOT NULL,     -- the digest it first arrived in
    source           TEXT NOT NULL,     -- newsletter name
    email_subject    TEXT,
    kind             TEXT NOT NULL CHECK (kind IN ('email_body', 'article')),
    title            TEXT NOT NULL,
    url              TEXT,              -- original article link; NULL for email-body items
    content_md       TEXT,              -- full text as Markdown; NULL when it couldn't be retrieved
    retrieval_status TEXT NOT NULL CHECK (retrieval_status IN ('ok', 'partial', 'paywalled', 'blocked', 'not_attempted')),
    also_in          TEXT[] NOT NULL DEFAULT '{}',  -- other newsletters that linked the same article (one card, not two)
    summary          TEXT,              -- enrichment below is filled after storing, so a ranking failure never loses content
    why_it_ranks     TEXT,
    rank             INTEGER,
    category         TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    enriched_at      TIMESTAMPTZ
);
CREATE INDEX items_digest_date_idx ON items (digest_date DESC);

CREATE TABLE events (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id         TEXT NOT NULL REFERENCES items (id),  -- also means an item with history can never be deleted
    action          TEXT NOT NULL CHECK (action IN ('open', 'read_now', 'later', 'build', 'dismiss', 'undo')),
    reason          TEXT,                                 -- free text, e.g. why it was dismissed
    undoes_event_id BIGINT REFERENCES events (id),        -- which earlier button press an 'undo' cancels
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),   -- stored in UTC; metrics count days in Europe/London
    CHECK ((action = 'undo') = (undoes_event_id IS NOT NULL))
);
CREATE INDEX events_item_idx ON events (item_id, occurred_at);
CREATE INDEX events_occurred_idx ON events (occurred_at);

-- Append-only enforced by the database itself, not just by app convention.
CREATE FUNCTION reject_event_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'events is append-only: % is not allowed', TG_OP;
END $$;

CREATE TRIGGER events_append_only
    BEFORE UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION reject_event_changes();

-- TRUNCATE skips row-level triggers, so it needs its own guard.
CREATE TRIGGER events_no_truncate
    BEFORE TRUNCATE ON events
    FOR EACH STATEMENT EXECUTE FUNCTION reject_event_changes();
