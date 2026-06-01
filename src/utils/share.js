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
