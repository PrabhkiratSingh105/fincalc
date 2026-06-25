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
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}
