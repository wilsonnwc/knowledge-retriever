import React from 'react';

// Leading spaces allowed: newsletter Markdown nests lists ("  - b"); nested items join the list, flattened.
const BULLET_RE = /^\s*[-*]\s+(.*)$/;
const NUMBERED_RE = /^\s*\d+\.\s+(.*)$/;
const H3_RE = /^#{3,6} (.*)$/; // h4-h6 (newsletter Markdown has them) render as h3
const H2_RE = /^## (.*)$/;
const H1_RE = /^# (.*)$/;
const BLOCKQUOTE_RE = /^>\s?(.*)$/;
const RULE_RE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
// At each position tries a backslash-escaped character ("\*" is a literal asterisk), then a [link](target), then
// **bold**, then *italic* — so "**bold**" is never misread as "*" + "*bold*" + "*". A link target may hold one
// level of parentheses (Wikipedia-style URLs) and be followed by a "title". Only http(s) targets become anchors;
// any other target (mailto:, javascript:, relative) renders as its plain link text.
const INLINE_RE = /\\([\\`*_{}[\]()#+\-.!>|~])|\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)|\*\*(.+?)\*\*|\*(.+?)\*/g;
const HTTP_RE = /^https?:\/\//i;
const INLINE_HEADER_RE = /^(#{1,6})\s+(.*)$/gm;

// Renders [links](https://…), **bold** and *italic* spans within a line of text, nested either way
// ("**[title](url)**" or "[**title**](url)"); everything else passes through as plain text.
function renderInline(text) {
  const parts = [];
  const re = new RegExp(INLINE_RE.source, 'g'); // own instance: renderInline recurses
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(match[1]);
    } else if (match[3] !== undefined) {
      const label = renderInline(match[2] || match[3]);
      parts.push(HTTP_RE.test(match[3])
        ? <a key={key++} href={match[3]} target="_blank" rel="noopener noreferrer">{label}</a>
        : <React.Fragment key={key++}>{label}</React.Fragment>);
    } else if (match[4] !== undefined) {
      parts.push(<strong key={key++}>{renderInline(match[4])}</strong>);
    } else {
      parts.push(<em key={key++}>{renderInline(match[5])}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Converts a "## Heading" line that appears within flattened inline text
// (chunking.py keeps a section's "## Title" line as the first line of its
// chunk text) into a bold span instead of literal "##" — there's no block
// element to render it as here, the way MarkdownLite's block parser would.
function stripInlineHeaderMarkers(text) {
  return text.replace(INLINE_HEADER_RE, (_match, _hashes, headerText) => `**${headerText}**`);
}

// Drops a "> " blockquote marker that appears mid-paragraph rather than at
// the start of its own line — the shape a chunk of embedded note text is in
// once it's been flattened into one flowing excerpt (e.g. a search result
// snippet). There's no separate block to render there, so the marker is
// just noise; renderInline still bolds the "**...**" text that follows it.
function stripInlineBlockquoteMarker(text) {
  return text.replace(/(^|\s)>\s*(?=\*\*)/g, '$1');
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
    const blockquote = line.match(BLOCKQUOTE_RE);
    if (RULE_RE.test(line)) return blocks.push({ type: 'hr' });
    if (h3) return blocks.push({ type: 'h3', text: h3[1] });
    if (h2) return blocks.push({ type: 'h2', text: h2[1] });
    if (h1) return blocks.push({ type: 'h1', text: h1[1] });
    if (blockquote && !blockquote[1].trim()) return blocks.push({ type: 'br' }); // bare ">" between quoted paragraphs
    if (blockquote) return blocks.push({ type: 'blockquote', text: blockquote[1] });
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
        if (block.type === 'blockquote') return <blockquote key={idx}>{renderInline(block.text)}</blockquote>;
        if (block.type === 'p') return <p key={idx}>{renderInline(block.text)}</p>;
        if (block.type === 'hr') return <hr key={idx} />;
        return <br key={idx} />;
      })}
    </>
  );
}

export default MarkdownLite;
export { renderInline, stripInlineBlockquoteMarker, stripInlineHeaderMarkers };
