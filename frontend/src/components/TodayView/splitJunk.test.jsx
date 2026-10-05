import { splitJunk } from './TodayView';

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
