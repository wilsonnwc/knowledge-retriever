import React from 'react';

const BULLET_RE = /^-\s+(.*)$/;
const NUMBERED_RE = /^\d+\.\s+(.*)$/;
const H3_RE = /^### (.*)$/;
const H2_RE = /^## (.*)$/;
const H1_RE = /^# (.*)$/;
const BOLD_RE = /\*\*(.+?)\*\*/g;

// Renders **bold** spans within a line of text; everything else passes
// through as plain text.
function renderInline(text) {
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  BOLD_RE.lastIndex = 0;
  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Minimal markdown rendering (headers, bullet/numbered lists, bold,
// paragraphs) — no external library, matches the level of formatting this
// project's notes actually use. Shared between the Import wizard's preview
// and the Notes read view so both render content the same way.
//
// Consecutive bullet/numbered lines are grouped into real <ul>/<ol>
// elements rather than emitted as bare <li>s — orphan <li>s outside a list
// container render inconsistently across browsers.
function MarkdownLite({ content }) {
  const lines = (content || '').split('\n');
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  lines.forEach((line) => {
    const bulletMatch = line.match(BULLET_RE);
    const numberedMatch = line.match(NUMBERED_RE);

    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[1]);
      return;
    }

    flushList();

    const h3 = line.match(H3_RE);
    const h2 = line.match(H2_RE);
    const h1 = line.match(H1_RE);
    if (h3) return blocks.push({ type: 'h3', text: h3[1] });
    if (h2) return blocks.push({ type: 'h2', text: h2[1] });
    if (h1) return blocks.push({ type: 'h1', text: h1[1] });
    if (line.trim()) return blocks.push({ type: 'p', text: line });
    blocks.push({ type: 'br' });
  });
  flushList();

  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === 'ul') {
          return (
            <ul key={idx}>
              {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx}>
              {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
            </ol>
          );
        }
        if (block.type === 'h1') return <h1 key={idx}>{renderInline(block.text)}</h1>;
        if (block.type === 'h2') return <h2 key={idx}>{renderInline(block.text)}</h2>;
        if (block.type === 'h3') return <h3 key={idx}>{renderInline(block.text)}</h3>;
        if (block.type === 'p') return <p key={idx}>{renderInline(block.text)}</p>;
        return <br key={idx} />;
      })}
    </>
  );
}

export default MarkdownLite;
