const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const storedToken = token || localStorage.getItem('rram_token');
  if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  let parseFailed = false;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch {
      parseFailed = true;
    }
  }

  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    localStorage.removeItem('rram_token');
    localStorage.removeItem('rram_user');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (!res.ok) {
    throw new Error((data && data.error) || 'Something went wrong. Please try again.');
  }
  if (parseFailed) {
    throw new Error('Unexpected response from server.');
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' })
};
