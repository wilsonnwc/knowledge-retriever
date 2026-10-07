import { groupBySource, splitJunk } from './TodayView';

test('borderline (judge) junk comes first, everything the rules filtered goes underneath', () => {
  const junk = [
    { id: 'a', class_reason: 'rule: destination contains \'/symbol/\'' },
    { id: 'b', class_reason: 'judge: promo landing page' },
    { id: 'c', class_reason: null },
    { id: 'd', class_reason: 'judge: job listing' },
  ];
  const [[h1, borderline], [h2, rules]] = splitJunk(junk);
  expect(h1).toBe('Borderline calls');
  expect(borderline.map((c) => c.id)).toEqual(['b', 'd']);
  expect(h2).toBe('Filtered by rules');
  expect(rules.map((c) => c.id)).toEqual(['a', 'c']);
});

test('Everything else becomes one group per newsletter, in the order the API sent', () => {
  const rows = [{ id: 't1', source: 'TLDR' }, { id: 't2', source: 'TLDR' }, { id: 'b1', source: 'Benedict Evans' }];
  expect(groupBySource(rows).map(([s, r]) => [s, r.map((c) => c.id)]))
    .toEqual([['TLDR', ['t1', 't2']], ['Benedict Evans', ['b1']]]);
});
