// Thin client for the Flask backend (backend/app.py). Every function
// throws a plain Error with a user-readable message on failure, so
// callers can show it directly instead of parsing response shapes.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

function encodeNoteId(noteId) {
  // note_id contains folder separators (e.g. "design/foo.md") that must
  // stay literal slashes in the URL, but each segment can contain
  // spaces/parentheses that do need encoding.
  return noteId.split('/').map(encodeURIComponent).join('/');
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (err) {
    throw new Error(`Could not reach the backend at ${API_BASE} — is it running?`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.status === 'error') {
    throw new Error((data && data.message) || `Request to ${path} failed (${response.status})`);
  }
  return data;
}

export function fetchNotes() {
  return request('/notes').then((data) => data.notes);
}

export function fetchNote(noteId) {
  return request(`/notes/${encodeNoteId(noteId)}`);
}

export function updateNote(noteId, updates) {
  return request(`/notes/${encodeNoteId(noteId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function deleteNote(noteId) {
  return request(`/notes/${encodeNoteId(noteId)}`, { method: 'DELETE' });
}

export function fetchTrash() {
  return request('/trash').then((data) => data.notes);
}

export function restoreNote(trashId) {
  return request(`/trash/${encodeNoteId(trashId)}/restore`, { method: 'POST' });
}

export function fetchTopics() {
  return request('/topics').then((data) => data.topics);
}

export function fetchTags() {
  return request('/tags').then((data) => data.tags);
}

export function importExtract(fileType, content) {
  return request('/import', {
    method: 'POST',
    body: JSON.stringify({ file_type: fileType, content })
  });
}

// Streams POST /search's Server-Sent Events. Not built on request() above —
// SSE needs the raw response body reader, not response.json(). Calls
// onDelta(text) as each chunk of the answer arrives, onDone(data) once with
// { sourcesSummary, sourcesElaboration, sources } after the stream ends,
// and onError(message) on any failure (network, non-OK response, or a
// mid-stream error event from the backend).
export async function searchStream(query, { onDelta, onDone, onError }) {
  let response;
  try {
    response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
  } catch (err) {
    onError(`Could not reach the backend at ${API_BASE} — is it running?`);
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    onError((data && data.message) || `Request to /search failed (${response.status})`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex;
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const eventMatch = rawEvent.match(/^event: (.+)$/m);
      const dataMatch = rawEvent.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const data = JSON.parse(dataMatch[1]);
      if (eventMatch[1] === 'delta') onDelta(data.text);
      else if (eventMatch[1] === 'done') onDone(data);
      else if (eventMatch[1] === 'error') onError(data.message);
    }
  }
}

export function importConfirm({ content, frontmatterUpdates, topicFolder, tags }) {
  return request('/import/confirm', {
    method: 'POST',
    body: JSON.stringify({
      content,
      frontmatter_updates: frontmatterUpdates,
      topic_folder: topicFolder,
      tags
    })
  });
}
