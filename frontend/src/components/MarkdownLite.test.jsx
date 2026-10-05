import React from 'react';
import { render, screen } from '@testing-library/react';
import MarkdownLite from './MarkdownLite';

test('links open in a new tab, nested either way inside bold', () => {
  render(<MarkdownLite content={'**[Upgrade](https://a.example/up)** and [**Story**](https://b.example/s) and [plain](https://c.example)'} />);
  const up = screen.getByRole('link', { name: 'Upgrade' });
  expect(up).toHaveAttribute('href', 'https://a.example/up');
  expect(up).toHaveAttribute('target', '_blank');
  expect(up.closest('strong')).not.toBeNull();
  expect(screen.getByRole('link', { name: 'Story' }).querySelector('strong')).not.toBeNull();
  expect(screen.getByRole('link', { name: 'plain' })).toHaveAttribute('rel', 'noopener noreferrer');
});

test('only http(s) targets become links; others show just their text', () => {
  const { container } = render(<MarkdownLite content={'[click](javascript:alert(1)) and [mail](mailto:x@y.z)'} />);
  expect(screen.queryAllByRole('link')).toHaveLength(0);
  expect(container.textContent).toBe('click and mail');
});

test('converter output shapes: titled links, parentheses in URLs, escaped asterisks', () => {
  const { container } = render(<MarkdownLite content={
    '[A](https://a.example/x "Title") [Wiki](https://w.org/F_(b)) growth 5 \\* 3 \\* 2'} />);
  expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', 'https://a.example/x');
  expect(screen.getByRole('link', { name: 'Wiki' })).toHaveAttribute('href', 'https://w.org/F_(b)');
  expect(container.textContent).toContain('growth 5 * 3 * 2');
  expect(container.querySelector('em')).toBeNull();
});

test('nested list items stay in the list; bare quote lines add no empty quote', () => {
  const { container } = render(<MarkdownLite content={'- a\n  - b\n\n> one\n>\n> two'} />);
  expect(container.querySelectorAll('li')).toHaveLength(2);
  expect(container.textContent).not.toContain('- b');
  expect(container.querySelectorAll('blockquote')).toHaveLength(2);
});

test('newsletter Markdown: rules and deep headings render as elements, not symbols', () => {
  const { container } = render(<MarkdownLite content={'Intro\n\n---\n\n#### Deep heading\n\nBody'} />);
  expect(container.querySelector('hr')).not.toBeNull();
  expect(screen.getByRole('heading', { name: 'Deep heading' })).toBeInTheDocument();
  expect(container.textContent).not.toContain('---');
  expect(container.textContent).not.toContain('####');
});

test('bold and italic still work without links', () => {
  const { container } = render(<MarkdownLite content={'**bold** and *italic*'} />);
  expect(container.querySelector('strong').textContent).toBe('bold');
  expect(container.querySelector('em').textContent).toBe('italic');
});
