import { API } from '../../config';
import { parseApiResponse } from '../../utils/api';

async function request(path, token, options = {}) {
  const requestOptions = {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  };
  let response = await fetch(`${API}${path}`, requestOptions);

  // Some local preview servers do not honor CRA's proxy. Retry only their HTML
  // "Cannot POST/GET" response, never an API JSON error or a production host.
  if (response.status === 404 && (!API || API.startsWith('http://localhost'))) {
    const body = await response.clone().text().catch(() => '');
    const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocal && /Cannot (GET|POST|PUT|DELETE)/i.test(body)) {
      response = await fetch(`http://localhost:3001${path}`, requestOptions);
    }
  }
  return parseApiResponse(response, 'AI service is unavailable.');
}

export const aiClient = {
  listChats: (token, query = '') => request(`/api/ai/chats${query ? `?q=${encodeURIComponent(query)}` : ''}`, token),
  createChat: (token, payload) => request('/api/ai/chats', token, { method: 'POST', body: JSON.stringify(payload) }),
  getChat: (token, id) => request(`/api/ai/chats/${id}`, token),
  updateChat: (token, id, payload) => request(`/api/ai/chats/${id}`, token, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteChat: (token, id) => request(`/api/ai/chats/${id}`, token, { method: 'DELETE' }),
  sendMessage: (token, id, payload) => request(`/api/ai/chats/${id}/messages`, token, { method: 'POST', body: JSON.stringify(payload) }),
};
