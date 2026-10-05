import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DecisionButtons from './DecisionButtons';

const fresh = { status: null, status_event_id: null, reason: null, build: false, build_event_id: null, build_note: null };

test('a fresh card offers Later, Completed, Skip and Build', () => {
  render(<DecisionButtons state={fresh} onDecide={jest.fn()} onUndo={jest.fn()} />);
  ['Later', 'Completed', 'Skip', 'Build'].forEach((name) => expect(screen.getByRole('button', { name })).toBeInTheDocument());
  expect(screen.queryByText('Read now')).not.toBeInTheDocument();
});

test('Completed is one tap and stores the read action', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
  expect(onDecide).toHaveBeenCalledWith('read');
});

test('skip reason is optional', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  fireEvent.click(screen.getByRole('button', { name: 'Skip' })); // confirm with an empty box
  expect(onDecide).toHaveBeenCalledWith('dismiss', { reason: undefined });
});

test('after Later, Completed and Skip stay on offer, and Later can be undone', () => {
  const onUndo = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={{ ...fresh, status: 'later', status_event_id: 42 }} onDecide={jest.fn()} onUndo={onUndo} />);
  expect(screen.getByText('✓ Saved for later')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Completed' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Later' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Undo Saved for later' }));
  expect(onUndo).toHaveBeenCalledWith(42);
});

test('Completed and Build show together, each with its own Undo', () => {
  const onUndo = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={{ ...fresh, status: 'read', status_event_id: 7, build: true, build_event_id: 9, build_note: 'a bot' }}
                          onDecide={jest.fn()} onUndo={onUndo} />);
  expect(screen.getByText('✓ Completed')).toBeInTheDocument();
  expect(screen.getByText('🛠 Build idea')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Undo Build idea' }));
  expect(onUndo).toHaveBeenCalledWith(9);
});

test('a failed skip keeps the reason box open with its text', async () => {
  const onDecide = jest.fn(() => Promise.reject(new Error('offline')));
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  fireEvent.change(screen.getByLabelText('Skip reason'), { target: { value: 'too long' } });
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByLabelText('Skip reason');
  expect(screen.getByLabelText('Skip reason')).toHaveValue('too long');
});

test('a saved build note does not carry over into a later skip', async () => {
  const onDecide = jest.fn(() => Promise.resolve());
  const { rerender } = render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Build' }));
  fireEvent.change(screen.getByLabelText('Build note'), { target: { value: 'a prototype' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save build idea' }));
  await screen.findByRole('button', { name: 'Skip' });
  rerender(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  expect(screen.getByLabelText('Skip reason')).toHaveValue('');
});

test('an old Read now card is still open: it offers Completed and Skip', () => {
  render(<DecisionButtons state={{ ...fresh, status: 'read_now', status_event_id: 3 }} onDecide={jest.fn()} onUndo={jest.fn()} />);
  expect(screen.getByText('✓ Reading')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Completed' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
});
