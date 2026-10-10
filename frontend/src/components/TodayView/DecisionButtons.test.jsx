import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DecisionButtons from './DecisionButtons';

const fresh = { status: null, status_event_id: null, reason: null, build: false, build_event_id: null, build_note: null };
const pressed = () => screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent);

test('a fresh card shows four unselected toggles in reading order, and no Undo', () => {
  render(<DecisionButtons state={fresh} onDecide={jest.fn()} onUndo={jest.fn()} />);
  expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Useful', 'Later', 'Not useful', '🛠 Build']);
  expect(pressed()).toEqual([]);
  expect(screen.queryByText('Undo')).not.toBeInTheDocument();
});

test('Useful is one tap and stores the read action with where it was pressed', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} surface="card" onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Useful' }));
  expect(onDecide).toHaveBeenCalledWith('read', { surface: 'card' });
});

test('a selected status shows filled, and tapping it again undoes that press', () => {
  const onUndo = jest.fn(() => Promise.resolve());
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={{ ...fresh, status: 'later', status_event_id: 42 }} onDecide={onDecide} onUndo={onUndo} />);
  expect(pressed()).toEqual(['✓ Later']);
  fireEvent.click(screen.getByRole('button', { name: '✓ Later' }));
  expect(onUndo).toHaveBeenCalledWith(42);
  expect(onDecide).not.toHaveBeenCalled();
});

test('picking another status while one is selected switches to it', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={{ ...fresh, status: 'later', status_event_id: 42 }} surface="reader" onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Useful' }));
  expect(onDecide).toHaveBeenCalledWith('read', { surface: 'reader' });
});

test('Useful and Build are both selected together; tapping Build again undoes only Build', () => {
  const onUndo = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={{ ...fresh, status: 'read', status_event_id: 7, build: true, build_event_id: 9, build_note: 'a bot' }}
                          onDecide={jest.fn()} onUndo={onUndo} />);
  expect(pressed()).toEqual(['✓ Useful', '✓ Build']);
  expect(screen.getByText('Build idea: “a bot”')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '✓ Build' }));
  expect(onUndo).toHaveBeenCalledWith(9);
});

test('not-useful reasons are multi-select pills saved together with ✓, no text box', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} surface="card" onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Low quality' }));
  fireEvent.click(screen.getByRole('button', { name: 'Not relevant' }));
  fireEvent.click(screen.getByRole('button', { name: 'Already know it' }));
  fireEvent.click(screen.getByRole('button', { name: 'Already know it' })); // tap again = unpick
  expect(onDecide).not.toHaveBeenCalled();                                 // nothing saved until ✓
  fireEvent.click(screen.getByRole('button', { name: 'Save not useful' }));
  expect(onDecide).toHaveBeenCalledWith('dismiss', { reason: 'Not relevant; Low quality', surface: 'card' });
});

test('✓ with no pill saves without a reason; ✕ goes back without saving', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel not useful' }));
  expect(onDecide).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Useful' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save not useful' }));
  expect(onDecide).toHaveBeenCalledWith('dismiss', { reason: undefined });
});

test('"Other…" opens a text box whose text joins the picked reasons; the reason shows under the buttons', async () => {
  const onDecide = jest.fn(() => Promise.resolve());
  const { rerender } = render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  fireEvent.click(screen.getByRole('button', { name: 'Not relevant' }));
  fireEvent.click(screen.getByRole('button', { name: 'Other…' }));
  fireEvent.change(screen.getByLabelText('Not useful reason'), { target: { value: 'paywalled' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save not useful' }));
  expect(onDecide).toHaveBeenCalledWith('dismiss', { reason: 'Not relevant; paywalled' });
  await screen.findByRole('button', { name: 'Useful' }); // the save finished and the pills closed
  rerender(<DecisionButtons state={{ ...fresh, status: 'dismiss', status_event_id: 3, reason: 'Low quality' }} onDecide={onDecide} onUndo={jest.fn()} />);
  expect(screen.getByText('Not useful: “Low quality”')).toBeInTheDocument();
});

test('an old Read now card shows nothing selected', () => {
  render(<DecisionButtons state={{ ...fresh, status: 'read_now', status_event_id: 3 }} onDecide={jest.fn()} onUndo={jest.fn()} />);
  expect(pressed()).toEqual([]);
});

test('a failed not-useful save keeps the reason box open with its text', async () => {
  const onDecide = jest.fn(() => Promise.reject(new Error('offline')));
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  fireEvent.click(screen.getByRole('button', { name: 'Other…' }));
  fireEvent.change(screen.getByLabelText('Not useful reason'), { target: { value: 'too long' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save not useful' }));
  await screen.findByLabelText('Not useful reason');
  expect(screen.getByLabelText('Not useful reason')).toHaveValue('too long');
});

test('a saved build note does not carry over into a later not-useful reason', async () => {
  const onDecide = jest.fn(() => Promise.resolve());
  const { rerender } = render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '🛠 Build' }));
  fireEvent.change(screen.getByLabelText('Build note'), { target: { value: 'a prototype' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save build idea' }));
  await screen.findByRole('button', { name: 'Not useful' });
  rerender(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  fireEvent.click(screen.getByRole('button', { name: 'Other…' }));
  expect(screen.getByLabelText('Not useful reason')).toHaveValue('');
});

test('the card offers the three reasons; the reader adds "Summary was enough" and saves with its surface', async () => {
  const onDecide = jest.fn(() => Promise.resolve());
  const { unmount } = render(<DecisionButtons state={fresh} surface="card" onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  expect(screen.queryByRole('button', { name: 'Summary was enough' })).not.toBeInTheDocument();
  unmount();
  render(<DecisionButtons state={fresh} surface="reader" onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not useful' }));
  expect(screen.getByText('Why not useful? Pick any, then ✓')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Summary was enough' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save not useful' }));
  expect(onDecide).toHaveBeenCalledWith('dismiss', { reason: 'Summary was enough', surface: 'reader' });
  await screen.findByRole('button', { name: 'Useful' }); // the save finished and the pills closed
});
