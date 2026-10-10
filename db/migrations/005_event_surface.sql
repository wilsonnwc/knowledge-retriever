-- Useful / Not useful signals (user decision, 2026-10-10; spec system/specs/2026-10-10-useful-signals.md).
--   'read' is now labelled Useful and 'dismiss' Not useful; the codes stay so history and status logic keep working.
--   surface — where the press was made: 'card' (judged from the summary) or 'reader' (judged from the article).
-- Nullable: presses from before this migration have none, which also marks them as the old Completed / Skip meaning.
-- Adding a nullable column rewrites no rows, so the append-only trigger is not involved.
ALTER TABLE events ADD COLUMN surface TEXT CHECK (surface IN ('card', 'reader'));
