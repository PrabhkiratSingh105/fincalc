export function encodeShareState(state) {
  try {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

export function decodeShareState(encoded) {
  if (!encoded) return null;
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function buildShareUrl(path, state) {
  const encoded = encodeShareState(state);
  if (!encoded) return window.location.href;
  const url = new URL(path, window.location.origin);
  url.searchParams.set('s', encoded);
  return url.toString();
}

export function readShareState(searchParams) {
  const encoded = searchParams.get('s');
  return decodeShareState(encoded);
}

async function parseApiResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Could not create share link.');
  }
  return data;
}

export async function createPublicConfigLink({ page, title, config }) {
  const response = await fetch('/api/public-configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, title, config }),
  });
  return parseApiResponse(response);
}

export async function fetchPublicConfig(page, token) {
  const response = await fetch(
    `/api/public-configs/${encodeURIComponent(page)}/${encodeURIComponent(token)}`
  );
  return parseApiResponse(response);
}
