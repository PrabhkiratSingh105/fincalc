export async function parseResponseBody(response) {
  const text = await response.text().catch(() => '');
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function parseApiResponse(response, fallbackMessage) {
  const data = await parseResponseBody(response);

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || data?.detail || data?.raw || fallbackMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
