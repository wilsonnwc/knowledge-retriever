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

export function search(query) {
  return request('/search', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
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
