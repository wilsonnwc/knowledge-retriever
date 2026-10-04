import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DecisionButtons from './DecisionButtons';

const fresh = { decision: null, decision_event_id: null, reason: null };

test('dismiss needs a reason before it can be confirmed', async () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByText('Dismiss'));
  const confirm = screen.getByRole('button', { name: 'Dismiss' });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Dismiss reason'), { target: { value: '   ' } });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Dismiss reason'), { target: { value: 'not relevant to me' } });
  fireEvent.click(confirm);
  expect(onDecide).toHaveBeenCalledWith('dismiss', { reason: 'not relevant to me' });
});

test('build note is optional', () => {
  const onDecide = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByText('Build'));
  fireEvent.click(screen.getByRole('button', { name: 'Save build idea' }));
  expect(onDecide).toHaveBeenCalledWith('build', { reason: undefined });
});

test('a decided card shows what was chosen and can be undone', () => {
  const onUndo = jest.fn(() => Promise.resolve());
  render(<DecisionButtons state={{ decision: 'later', decision_event_id: 42, reason: null }}
                          onDecide={jest.fn()} onUndo={onUndo} />);
  expect(screen.getByText('✓ Saved for later')).toBeInTheDocument();
  expect(screen.queryByText('Read now')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Undo'));
  expect(onUndo).toHaveBeenCalledWith(42);
});

test('a failed dismiss keeps the reason box open with its text', async () => {
  const onDecide = jest.fn(() => Promise.reject(new Error('offline')));
  render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByText('Dismiss'));
  fireEvent.change(screen.getByLabelText('Dismiss reason'), { target: { value: 'too long' } });
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  await screen.findByLabelText('Dismiss reason');
  expect(screen.getByLabelText('Dismiss reason')).toHaveValue('too long');
});

test('a saved build note does not carry over into a later dismiss', async () => {
  const onDecide = jest.fn(() => Promise.resolve());
  const { rerender } = render(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByText('Build'));
  fireEvent.change(screen.getByLabelText('Build note'), { target: { value: 'a prototype' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save build idea' }));
  await screen.findByText('Dismiss');  // back to the four buttons
  rerender(<DecisionButtons state={fresh} onDecide={onDecide} onUndo={jest.fn()} />);
  fireEvent.click(screen.getByText('Dismiss'));
  expect(screen.getByLabelText('Dismiss reason')).toHaveValue('');
});
