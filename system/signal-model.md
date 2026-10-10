# Signal model: what a Today-page press means

**Status:** agreed with the user on 2026-10-10. This is the data contract that later phases read (Phase 4 skill evidence, Phase 5 agent labels, Phase 7 error analysis, Phase 8 source scorecards). Change it only through a spec's change log.

## The two things we learn from a press

- **Value (explicit, one tap):** was this useful to me? Yes or no. Binary on purpose: it is easier to judge consistently, and it matches Phase 7's binary judges.
- **Depth (from where the tap happened, no extra tap):** was the judgement made on the summary or on the article?
  - **Card** = judged from the summary.
  - **Reader** = judged from the article.
  - "Skimmed vs read fully" was considered and dropped (user, 10 Oct): too hard to judge consistently, so it would add noise, not information.

## How it is stored (events table, append-only)

| Field | Values | Meaning |
|---|---|---|
| `action` | `read` | **Useful.** (Labelled "Completed" before 10 Oct.) |
| | `dismiss` | **Not useful.** (Labelled "Skip" before 10 Oct.) |
| | `later` | Not now. Not a value judgement. |
| | `build` | Build idea, a flag beside any status. |
| | `open` | Reader opened. Recorded automatically. |
| `surface` | `card`, `reader` | Where a `read`/`dismiss`/`later`/`build` press was made. **NULL = a press from before 10 Oct**, which used the old meaning. |
| `reason` | text | For Not useful: chosen reasons joined by `; `. |

**Not-useful reasons:** "Not relevant", "Already know it", "Low quality", "Other…" everywhere, plus **"Summary was enough"** in the reader only. That last one means the topic was fine but the article added nothing beyond the summary: a lesson about the summary, not the source.

## Reading the signals

| Surface | Value | What it tells the ranking |
|---|---|---|
| card | Useful | The summary alone was worth it. Keep items like this |
| card | Not useful | The topic isn't for me |
| reader | Useful | The article was worth it. Strongest positive, and Phase 4 skill evidence |
| reader | Not useful | The summary hooked me but the article didn't deliver. Use the reason to tell "the summary was enough" from "the content was bad" |

- **"Opened before pressing"** is derived when analysing, not stored: a card press with an earlier `open` event for the same item counts as an article-level judgement (for example, after reading, swiping back and tapping on the card).
- **Known gap:** `open` events made with no signal (on a train) fail silently and are lost.
- **Signals are used in periodic ranking reviews, not to re-rank live** (user, 10 Oct), the same pattern as junk-filter tuning.

## Old presses (before 10 Oct)

- `surface` IS NULL. Old `read` ("Completed") roughly means Useful, and old `dismiss` ("Skip") roughly means Not useful. Treat them as weaker labels.
- Their depth can still be inferred from `open` events (on 10 Oct: 28 of 30 Completed items had been opened).
