-- Today page decisions, revised by the user on 2026-10-05 after the first mobile review:
--   'read' = "Completed": the user finished reading (the old 'read_now' meant "about to read").
--   Later / Completed / Skip form one reading status (latest wins); Build is a separate flag beside it.
--   Skip is the UI label for 'dismiss' (same meaning), and its reason is now optional (app-side).
-- 'read_now' stays allowed so the existing history remains valid; the app no longer writes it.
-- Approved by the user (real events exist, so migrations need an explicit OK).
ALTER TABLE events DROP CONSTRAINT events_action_check;
ALTER TABLE events ADD CONSTRAINT events_action_check
    CHECK (action IN ('open', 'read', 'read_now', 'later', 'build', 'dismiss', 'undo', 'not_junk'));
