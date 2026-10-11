import { useCallback, useEffect, useRef } from 'react';
import * as api from '../../api/client';

// "Seen" impressions (spec system/specs/2026-10-11-seen-impressions.md): a Today-tab card counts as seen once it
// has been visible enough for SEEN_MS. Lets the ranking review tell "seen, not pressed" (a weak negative) from
// "never reached" (no signal). Each impression belongs to the day's page it was seen on (older pages included);
// they queue up and go out in batches, and the server keeps one per card per page.
export const SEEN_MS = 1000;
export const FLUSH_MS = 5000;
const THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

// Half the card on screen — or, for a card taller than the screen, half the screen filled by it.
export function isVisibleEnough(entry) {
  if (!entry.isIntersecting) return false;
  const screen = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
  return entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= screen / 2;
}

// refFor(id) gives a stable ref callback for a card's element; markSeen(id) records it at once (a press or a
// reader open proves the card was seen, even under SEEN_MS). Failed sends are dropped silently, by design.
// `digestDate` is the day whose page is shown. `active` is false while nothing should count (the reader covering
// the list, or no page loaded yet).
export function useSeenTracker(digestDate, active = true) {
  const marked = useRef(new Set());     // "day|id" already queued in this page session
  const activeRef = useRef(active && Boolean(digestDate));
  const dayRef = useRef(digestDate);
  dayRef.current = digestDate;
  const queue = useRef([]);             // [day, id] pairs
  const timers = useRef(new Map());     // element -> pending 1 s timer
  const elementIds = useRef(new Map()); // element -> id
  const idElements = useRef(new Map()); // id -> element
  const refs = useRef(new Map());       // id -> stable ref callback
  const observer = useRef(null);

  const flush = useCallback((keepalive = false) => {
    if (queue.current.length === 0) return;
    const byDay = new Map();
    queue.current.forEach(([day, id]) => byDay.set(day, [...(byDay.get(day) || []), id]));
    queue.current = [];
    // dropped, not retried (spec) — but un-marked, so a later press or look can still record the card
    byDay.forEach((ids, day) => api.recordSeen(ids, day, { keepalive })
      .catch(() => ids.forEach((id) => marked.current.delete(`${day}|${id}`))));
  }, []);

  const markSeen = useCallback((id) => {
    const day = dayRef.current; // no `active` check: a press proves the card was seen, even from the reader
    if (!day || marked.current.has(`${day}|${id}`)) return;
    marked.current.add(`${day}|${id}`);
    queue.current.push([day, id]);
  }, []);

  const stopTimer = (el) => {
    clearTimeout(timers.current.get(el));
    timers.current.delete(el);
  };
  const stopAllTimers = () => timers.current.forEach((_, el) => stopTimer(el));
  // Re-observing makes the observer report each card's current visibility again, restarting the clocks.
  const restart = () => elementIds.current.forEach((_, el) => {
    if (observer.current) { observer.current.unobserve(el); observer.current.observe(el); }
  });

  useEffect(() => {
    activeRef.current = active && Boolean(digestDate);
    stopAllTimers(); // a clock started on another day's page must not finish on this one
    if (activeRef.current) restart();
  }, [active, digestDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const id = elementIds.current.get(el);
        if (!id || marked.current.has(`${dayRef.current}|${id}`)) return; // already seen on this page
        if (!activeRef.current || !isVisibleEnough(entry)) stopTimer(el);
        else if (!timers.current.has(el)) {
          timers.current.set(el, setTimeout(() => { timers.current.delete(el); markSeen(id); }, SEEN_MS));
        }
      });
    }, { threshold: THRESHOLDS });
    elementIds.current.forEach((_, el) => observer.current.observe(el)); // cards mounted before this effect

    const interval = setInterval(() => flush(), FLUSH_MS);
    // hidden (phone locked, app switched): stop the clocks and send; visible again: re-check what's on screen
    const onHidden = () => {
      if (document.visibilityState === 'hidden') { stopAllTimers(); flush(true); } else restart();
    };
    const onPageHide = () => flush(true);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);
    const pending = timers.current;
    return () => {
      observer.current.disconnect();
      observer.current = null;
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      flush(true); // leaving the Today page
    };
  }, [flush, markSeen]);

  const refFor = useCallback((id) => {
    if (!refs.current.has(id)) {
      refs.current.set(id, (el) => {
        const prev = idElements.current.get(id);
        if (prev) {
          if (observer.current) observer.current.unobserve(prev);
          stopTimer(prev);
          elementIds.current.delete(prev);
          idElements.current.delete(id);
        }
        if (el) {
          elementIds.current.set(el, id);
          idElements.current.set(id, el);
          if (observer.current) observer.current.observe(el);
        }
      });
    }
    return refs.current.get(id);
  }, []);

  return { refFor, markSeen };
}
