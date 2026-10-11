import React from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
import { useSeenTracker, isVisibleEnough, SEEN_MS, FLUSH_MS } from './seenTracker';
import * as api from '../../api/client';

jest.mock('../../api/client', () => ({ recordSeen: jest.fn() }));

let observerCallback;
beforeEach(() => {
  jest.useFakeTimers();
  api.recordSeen.mockImplementation(() => Promise.resolve({ recorded: 1 })); // CRA resets mocks before each test
  window.IntersectionObserver = jest.fn((cb) => {
    observerCallback = cb;
    return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
  });
});
afterEach(() => jest.useRealTimers());

const DAY = '2026-10-11';
function Cards({ ids, active = true, day = DAY }) {
  const { refFor, markSeen } = useSeenTracker(day, active);
  return ids.map((id) => (
    <div key={id} ref={refFor(id)} data-testid={id}>
      <button onClick={() => markSeen(id)}>press {id}</button>
    </div>
  ));
}

const entry = (el, ratio, height = 100, screenHeight = 800) => ({
  target: el, isIntersecting: ratio > 0, intersectionRatio: ratio,
  intersectionRect: { height: height * ratio }, rootBounds: { height: screenHeight },
});
const show = (el, ratio, height, screenHeight) => act(() => observerCallback([entry(el, ratio, height, screenHeight)]));
const wait = (ms) => act(() => { jest.advanceTimersByTime(ms); });

test('a card half visible for 1 second is recorded once; batches go out every few seconds', () => {
  render(<Cards ids={['a', 'b']} />);
  show(screen.getByTestId('a'), 0.5);
  show(screen.getByTestId('b'), 1);
  wait(SEEN_MS - 1);
  wait(1);
  wait(FLUSH_MS);
  expect(api.recordSeen).toHaveBeenCalledTimes(1);
  expect(api.recordSeen).toHaveBeenCalledWith(['a', 'b'], DAY, { keepalive: false });
  show(screen.getByTestId('a'), 0);   // scroll away and back: already seen this session
  show(screen.getByTestId('a'), 1);
  wait(SEEN_MS + FLUSH_MS);
  expect(api.recordSeen).toHaveBeenCalledTimes(1);
});

test('a quick flick (under 1 second) or a sliver on screen records nothing', () => {
  render(<Cards ids={['a', 'b']} />);
  show(screen.getByTestId('a'), 1);
  wait(SEEN_MS - 200);
  show(screen.getByTestId('a'), 0);
  show(screen.getByTestId('b'), 0.3);
  wait(SEEN_MS + FLUSH_MS);
  expect(api.recordSeen).not.toHaveBeenCalled();
});

test('a press marks the card seen at once, and leaving the page sends what is pending', () => {
  render(<Cards ids={['a']} />);
  fireEvent.click(screen.getByText('press a'));
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(api.recordSeen).toHaveBeenCalledWith(['a'], DAY, { keepalive: true });
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

test('a card taller than the screen counts once it fills half the screen', () => {
  const el = document.createElement('div');
  expect(isVisibleEnough(entry(el, 0.4, 2000, 800))).toBe(true);   // 800px of card on an 800px screen
  expect(isVisibleEnough(entry(el, 0.15, 2000, 800))).toBe(false); // 300px: under half the screen
  expect(isVisibleEnough(entry(el, 0.4, 100, 800))).toBe(false);   // a short card needs half of itself
});

test('while the reader covers the list, looks do not count but a press still does', () => {
  render(<Cards ids={['a', 'b']} active={false} />);
  show(screen.getByTestId('a'), 1);
  show(screen.getByTestId('b'), 1);
  wait(SEEN_MS + FLUSH_MS);
  expect(api.recordSeen).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('press b'));   // pressing Useful / Not useful in the reader
  wait(FLUSH_MS);
  expect(api.recordSeen).toHaveBeenCalledWith(['b'], DAY, { keepalive: false });
});

test('locking the phone stops the clock: a 200 ms glimpse never counts', () => {
  render(<Cards ids={['a']} />);
  show(screen.getByTestId('a'), 1);
  wait(200);
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  wait(SEEN_MS + FLUSH_MS);
  expect(api.recordSeen).not.toHaveBeenCalled();
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

test('after a failed send, a later press can still record the card', async () => {
  api.recordSeen.mockImplementationOnce(() => Promise.reject(new Error('offline')));
  render(<Cards ids={['a']} />);
  fireEvent.click(screen.getByText('press a'));
  wait(FLUSH_MS);
  await act(async () => {}); // let the failure come back
  fireEvent.click(screen.getByText('press a'));
  wait(FLUSH_MS);
  expect(api.recordSeen).toHaveBeenCalledTimes(2);
  expect(api.recordSeen).toHaveBeenLastCalledWith(['a'], DAY, { keepalive: false });
});

test('catching up on an older page records against that page, and switching days restarts the clock', () => {
  const { rerender } = render(<Cards ids={['a']} day="2026-10-09" />);
  show(screen.getByTestId('a'), 1);
  wait(SEEN_MS - 200);
  rerender(<Cards ids={['a']} day="2026-10-10" />);   // switched before the second was up: not seen on 9 Oct
  show(screen.getByTestId('a'), 1);
  wait(SEEN_MS + FLUSH_MS);
  expect(api.recordSeen).toHaveBeenCalledTimes(1);
  expect(api.recordSeen).toHaveBeenCalledWith(['a'], '2026-10-10', { keepalive: false });
  rerender(<Cards ids={['a']} day="2026-10-09" />);   // the same card on another page is its own impression
  show(screen.getByTestId('a'), 1);
  wait(SEEN_MS + FLUSH_MS);
  expect(api.recordSeen).toHaveBeenLastCalledWith(['a'], '2026-10-09', { keepalive: false });
});
