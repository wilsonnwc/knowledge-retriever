# Design review — detail — Today page — 2026-10-05

**Verdict:** 11 issues worth fixing: 0 Critical, 2 Major (low-contrast accent text on the Today cards), 9 Minor. The core Today flow works on phone and desktop.

**Reviewed:** Today list, reader (incl. auto-hiding bars), decision toggles, Skip reason pills, Build note, Later tab, Junk tab, slow / unreachable / failed-request states — at phone 390px, phone 320px, tablet 768px, desktop 1440px. Local build on the real 4 Oct data (Chromium device emulation, not real iOS Safari).

Run folder (git-ignored): `.design-review/runs/20261005-190521-detail`

## CRITICAL

None.

## MAJOR

F1. **[clear] today-list (Top 3 cards; also visible behind the reader and in all decision states) · Rank numbers "#1", "#2", "#3" on the Top 3 cards (.today-rank)** — The orange rank numbers measure 3.12:1 (#d97757 on #ffffff, 18px normal weight), below the 4.5:1 AA minimum for text of this size. In bright light on a phone the rank labels are hard to read. The card order still shows the ranking, so the information isn't lost.
   - Fix: Use a darker shade of the accent for rank text only, e.g. #a85a3f (5.0:1 on white). Keep the accent hue.
   - Evidence: capture today-list--today-list-top--phone → axe color-contrast on .today-card:nth-child(5|6|7) > .today-title > .today-rank (3.12:1, #d97757 on #ffffff, 18px); same in today-list--today-list-top--phone320, --tablet, --desktop

F2. **[clear] today-list / reader bottom bar (decision buttons) · "🛠 Build" toggle button in its off (tinted) state (.tone-build.toggle.today-btn)** — The Build label measures 3.44:1 (#c4643f on #faebe3, 15px normal weight), below the 4.5:1 AA minimum. The Build label is harder to read than Completed, Later and Skip next to it, especially outdoors on a phone.
   - Fix: Darken the Build label text to a deeper shade of the same accent, e.g. #a4502f (4.79:1 on #faebe3) or #9c4a2c (5.27:1). Keep the accent colour and the tinted-off / filled-on pattern, since both are accepted decisions.
   - Evidence: capture today-list--today-list-top--phone → axe color-contrast on .today-card:nth-child(5|6|7) .tone-build.today-btn.toggle (3.44:1, #c4643f on #faebe3, 15px); repeated across today-list, decisions and reader captures at all four viewports


## MINOR

F3. **[clear] today-list (Everything else rows) · Single-line item title buttons that open the reader (button.today-title), e.g. "Calendar", "The Weekend RIP!"** — Single-line row titles are only 22px tall. That passes WCAG 2.5.8 through the spacing exception but is well below the 44px touch recommendation, and the title is the way to open an item. Opening an Everything-else item on a phone needs a precise tap on a thin line of text.
   - Fix: Add vertical padding to button.today-title (e.g. padding 11px 0 with a matching negative margin) so each title's tap area is at least 44px tall without changing the layout.
   - Evidence: capture today-list--today-list-top--phone → tapTargets: button.today-title "Calendar" 328×22, "7 Best Space Stocks to Own in 2026" 328×22, "The Weekend RIP!" 328×22 (below-24-spacing-ok); phone320 258×22; tablet 698×22

F4. **[clear] today-api-unreachable · Red error banner on the Today page when the data request fails** — The banner shows a developer message ("Could not reach the backend at http://localhost:5050/api — is it running?") above empty tabs, with no Retry action. On a phone the user has to know to reload the whole page to recover, and the localhost wording means nothing on the hosted site.
   - Fix: Change the banner to "Couldn't load today's items. Check your connection and try again." and add a "Try again" button inside it that re-requests /api/today.
   - Evidence: screenshots/today-api-unreachable--today-with-api-unreachable--phone.png (banner, then Today/Later/Junk tabs with a blank body); capture today-api-unreachable--today-with-api-unreachable--phone → alert text "Could not reach the backend at http://localhost:5050/api — is it running?", buttons contain no retry

F5. **[clear] reader-fails · Error message in the reader body when the article request fails** — The reader shows the same developer error message in place of the article, with no Retry action. To retry, the user has to go Back and re-open the item, and the message doesn't tell them that.
   - Fix: Change the message to "Couldn't load this article." and add a "Try again" button that re-requests the item.
   - Evidence: screenshots/reader-fails--reader-item-request-fails--phone.png (title, then banner "Could not reach the backend at http://localhost:5050/api — is it running?", blank body); aria/reader-fails--reader-item-request-fails--phone.yml → dialog contains only "← Back" and the decision buttons

F6. **[tradeoff] reader · Start of the reader body for the #1 item** — Before the article starts, the reader repeats the title twice more (body text and an h1) and shows a column of podcast-player links ("Lenny's Podcast: Product | Ca…", the title again, "0:00", "37:22", "Listen now") carried over from the email. The user scrolls past most of the first phone screen of email leftovers before the actual content starts.
   - Fix: When converting the article for the reader, drop a leading heading or paragraph that matches the item title, and drop link-only lines that are timestamps (e.g. "0:00", "37:22") or "Listen now".
   - Evidence: screenshots/reader--reader-top--phone.png (title in header, title repeated in body, then the link column); capture reader--reader-top--phone → headings: h2 and h1 both "OpenAI's Head of ChatGPT: We're entering a new era of AI (again) | Tibo Sottiaux"

F7. **[tradeoff] today-list (entry) · App start screen: opens on the search landing page, with Today behind the ☰ menu** — On a phone, reaching the daily Today page takes two extra taps (☰, then "📰 Today") on every visit because the app opens on search. For a daily triage habit, the user repeats the same detour every time they open the app.
   - Fix: Open on Today by default (or reopen the last-used screen), keeping Search one tap away in the menu.
   - Evidence: capture today-list--phone → h1 "How can I help you today?", buttons "Open menu", "📰 Today"; screenshots/today-list--phone.png; brief: "it opens on a search screen. Reach Today via the sidebar button"

F8. **[clear] search landing page (outside the Today task) · Hint text under the search box, "Searches your saved notes only — not the web." (.chat-input-hint)** — The hint measures 2.7:1 (#999999 on #faf9f5, 13px), below the 4.5:1 AA minimum. The hint is hard to read, but it is on the search screen, which isn't part of the Today task.
   - Fix: Change the hint colour to #666666 (5.45:1 on #faf9f5).
   - Evidence: capture today-list--phone → axe color-contrast on .chat-input-hint (2.7:1, #999999 on #faf9f5, 13px); same in today-list--phone320, --tablet, --desktop

F9. **[clear] search landing page (outside the Today task) · Unselected "Import" tab in the Search / Import switch (button[type="button"]:nth-child(2))** — The unselected tab label measures 4.19:1 (#6b6b6a on #e5e4df, 14px), just below the 4.5:1 AA minimum. The inactive option is slightly harder to read. It is on the search screen, outside the Today task.
   - Fix: Change the unselected tab text colour to #5c5c5b (5.26:1 on #e5e4df).
   - Evidence: capture today-list--phone → axe color-contrast on button[type="button"]:nth-child(2) (4.19:1, #6b6b6a on #e5e4df, 14px); screenshots/today-list--phone.png shows this is the "Import" segment

F10. **[clear] sidebar (desktop; outside the Today task) · "+ New" button at the top of the sidebar (.sidebar-new-btn)** — The white label on the orange button measures 3.12:1 (#ffffff on #d97757, 15px), below the 4.5:1 AA minimum. The button label is harder to read on desktop. The button starts a new search, which isn't part of the Today task.
   - Fix: Darken the button background to #a85a3f (5.0:1 with white text), or make the label bold at 19px or larger so it counts as large text (3:1 threshold).
   - Evidence: capture today-list--today-list-top--desktop → axe color-contrast on .sidebar-new-btn (3.12:1, #ffffff on #d97757, 15px); flagged in desktop captures only

F11. **[clear] sidebar (desktop; outside the Today task) · Active sidebar item "📰 Today" (.active.sidebar-nav-item)** — The active item's label measures 3.44:1 (#c4643f on #faebe3, 15px), below the 4.5:1 AA minimum. The current-section label is a little harder to read. The tinted background still shows which item is active.
   - Fix: Use the same darker accent text as F2 (e.g. #a4502f, 4.79:1 on #faebe3) for the active nav item.
   - Evidence: capture today-list--today-list-top--desktop → axe color-contrast on .active.sidebar-nav-item (3.44:1, #c4643f on #faebe3, 15px); flagged in desktop captures only


## Possible issues (lower confidence)

- P1: Stand-alone link lines are 20px tall, below the 44px touch recommendation.
- P2: "Active 0 of 5 days this month" doesn't explain what counts as active, and the banner appears above all three tabs.

## Not verified

- Keyboard and focus behaviour: focus visibility and order, Skip pills and Build note by keyboard, and whether the auto-hiding reader bars hide a focused control (WCAG 2.4.11). No keyboard pass was captured. (accessibility)
- Whether tapping 'Not junk' gives visible feedback (row moves or toast). Only the before-state was captured. (usability)
- Whether an item marked Later appears in the Later tab. Only the empty Later tab was captured. (usability)
- Whether marking an item from inside the reader keeps the reader open or returns to the list. (usability)
- Whether Skip ✓ can be pressed with zero reasons picked. The ✓ is grey but wasn't tested. (usability)
- Tap-target sizes of the Skip pills and the ✓/✕ buttons, which aren't itemised in summary.md. (responsive)
- Share of the phone viewport taken by the reader's top and bottom bars and the Skip panel. Full-page screenshots of the fixed overlay don't show real in-viewport sizes. (responsive)
- Later and Junk tabs under slow or failed API responses, offline reload, and empty states. (resilience)
- Autocomplete attributes. The only inputs are on the search landing page and the Build note, so this probably doesn't apply. (accessibility)

## Verify on a real phone

- Reader top and bottom bars and the Skip-pill panel on a notched iPhone: safe-area inset under the bottom bar, and Safari's address bar resizing while the bars auto-hide.
- Build note textarea with the on-screen keyboard open: the note box and its save/cancel buttons stay visible above the keyboard.
- iOS back-swipe from the reader returns to the list at the same scroll position.
- Search landing page: the 13px project filter select may make iOS zoom in on focus (outside the Today task).

## Rejected candidates

- a11y-7: Evidence contradicts the screen-reader claim: aria/today-list--phone.yml shows textbox "How can I help you today?", and the same text is the visible h1 right above the box. axe reported no label violation. It is also on the search landing page, outside the Today task.
- a11y-8: Evidence contradicts the claim: aria/today-list--phone.yml shows combobox "Scope search to a project", so the select has an accessible name, and axe reported no select-name violation. The visible value 'All notes' and the hint below show its purpose. It is also on the search landing page, outside the Today task.
- copy-1: Not a real problem. 'Pick any, then ✓' is ordinary English for choosing any number, which matches the accepted multi-select design. The proposed 'Pick a reason' would wrongly suggest picking only one. The Skip pills design is an accepted decision.

## Noticed by the Verifier, not reported by any reviewer (for the product owner)

- Build note's orange save button: white on #d97757 = 3.12:1 (axe, desktop Build-note captures).
- Faded text on Completed/Skipped cards: 1.81–3.78:1 (.today-meta, .today-why, .today-rank, .today-title, .today-summary) — may be the intended 'done' look.
