# Spike results: can a relevance score predict my presses? (2026-10-13)

**Question:** given a short brief about the reader, can a model's relevance score predict which articles the reader marks Useful vs Not useful? And is Jev (System One) a good fit for this compared with Haiku?
**Status:** spike: offline, read-only, nothing changed live. Script: `run.py` in this folder. The reader brief (v0) is kept privately in `claude-brain/briefs/` and was written **without looking at the labels**.

## Set-up
- **Articles:** 122. These are 58 judged ones (36 Useful, 22 Not useful, by the latest live press; 18 of them since 10 Oct under the new Useful/Not-useful buttons), plus 64 seen but not pressed.
- **Scorers:**
  - **Today's ranking** (Top 3 = 3, Next 7 = 2, Everything else = 1)
  - **Jev** (`jev-latest`, Score primitive, 4-level rubric)
  - **Haiku 4.5** (same brief, same rubric, one digit)
- **Metric:** AUC, the chance that a random article from the first group scores above a random one from the second. 50% = a coin flip.

## Results

| Scorer | Useful vs Not useful (all 58) | Useful vs Not useful (18 since 10 Oct) | **Pressed vs scrolled past** (58 vs 64) | Run-to-run stability | Median latency | Cost for 122 articles |
|---|---|---|---|---|---|---|
| Today's ranking | 49% | 61% | 82% | — | — | (already paid nightly) |
| Haiku 4.5 | 47–51% | 54–62% (varies by run) | 81% | Changed its answer on 5 of 121 | 567 ms | $0.15 |
| **Jev** | 47–48% | **64%** (same both runs) | **86%** | Average change 0.025 on a 0–3 scale | **273 ms** | **≈ $0.008** (≈185k input tokens at $0.042/M; output free) |

Two runs of the full spike; the ranges show run-to-run variation.

## What it means
1. **No scorer can tell Useful from Not useful yet** (all near a coin flip on 58 articles; the 18-article column is too small to trust, since one article moves it by several points).
2. **The reason is in the reader's own Not-useful reasons:** only about a third are about topic relevance. The rest are:
   - **novelty** ("already know it", "read it in another newsletter")
   - **quality and format** (too long, low quality)
   - **promotions or paywall teasers**
   - **label noise:** 3 old "Skip" presses whose reason says the *summary was useful*
   
   A relevance score can't see any of these. That supports the August plan's split into Gap (relevance), Novelty (vs my notes and history) and Authority/quality agents.
3. **Relevance does predict engagement:** all scorers rank the articles I pressed well above the ones I scrolled past. **Jev is best (86%)**, ahead of Haiku and today's ranking (both 81–82%).
4. **Jev's practical profile fits the "decision layer" role:**
   - about **2× faster** than Haiku
   - about **20× cheaper** on this task (the vendor claims up to 444×; our own measurement is about 20× here)
   - **deterministic in practice**: the same input gives the same score, so differences between days are real, not noise
5. **Article types** (Jev's labels): opinion 18 Useful / 9 Not; market update 11 / 8; case study 3 / 3; how-to 3 / 2. No type is clearly better yet, so "market updates are less useful" is **not** supported by this data. The reader said as much: summaries of updates are often enough.

## Caveats
- **Small samples:** 58 judged articles, of which 18 have clean labels. Treat everything here as direction, not proof.
- **"Scrolled past" uses only 2 days of "seen" data**, and position bias is mixed in: low-ranked articles are scrolled past more. Jev's higher engagement AUC partly reflects agreeing with what was shown.
- **Brief v0 is a first draft** that the reader hasn't edited.
- Jev's median confidence was 0.62, so it was often unsure. Whether that confidence is calibrated is not tested yet; that needs more labels.

## Decisions this suggests (for the user)
- **Use Jev as the cheap first-pass relevance scorer** in the ranking cascade: it scores every item, and the LLM picks and explains the top items. Validate it in shadow mode at the signal review (R4) with 3–4 weeks of cleaner labels.
- **Relevance alone won't fix "Not useful".** The next ranking gains come from **novelty** (needs the library merge, R3) and **promo/quality** filtering, not a better relevance model.
- **Re-run this exact spike at R4** (same script, brief v1 rewritten from the signal review) so the comparison is like-for-like over time.
