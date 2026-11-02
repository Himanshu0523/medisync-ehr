const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem('medisync_access_token'),
    refreshToken: localStorage.getItem('medisync_refresh_token'),
  };
};

export const setStoredTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('medisync_access_token', accessToken);
  if (refreshToken) localStorage.setItem('medisync_refresh_token', refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem('medisync_access_token');
  localStorage.removeItem('medisync_refresh_token');
  localStorage.removeItem('medisync_user');
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) {
    clearStoredTokens();
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      clearStoredTokens();
      throw new ApiError(json.message || 'Refresh failed', res.status);
    }

    const { accessToken, refreshToken: newRefresh } = json.data;
    setStoredTokens({ accessToken, refreshToken: newRefresh });
    return accessToken;
  } catch (err) {
    clearStoredTokens();
    throw err;
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const { accessToken } = getStoredTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  let response = await fetch(url, config);

  // If unauthorized and we have a token, try silent refresh
  if (response.status === 401 && accessToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newAccessToken = await refreshPromise;
      config.headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(url, config);
    } catch {
      window.dispatchEvent(new CustomEvent('medisync:auth-expired'));
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { success: response.ok, message: await response.text() };
  }

  if (!response.ok || (data && data.success === false)) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data?.details);
  }

  return data;
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options) =>
    apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};

export default api;
