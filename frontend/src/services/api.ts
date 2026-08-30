import { auth } from '../config/firebase';

const API_BASE_URL = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('notifywork_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('notifywork_token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('notifywork_token');
};

async function request<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  customHeaders: HeadersInit = {}
): Promise<T> {
  let token = getAuthToken();

  // Dynamically fetch fresh Firebase ID token if user is signed in
  if (auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken();
      if (freshToken) {
        token = freshToken;
        setAuthToken(freshToken);
      }
    } catch (e) {
      // Ignore token fetch error and use stored token
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr: any) {
    throw new Error('Cannot reach the server. Please check your connection.');
  }

  // Gracefully handle token expiry / 401 / 403 with automatic token refresh
  if ((response.status === 401 || response.status === 403) && auth.currentUser) {
    try {
      const refreshedToken = await auth.currentUser.getIdToken(true);
      if (refreshedToken) {
        setAuthToken(refreshedToken);
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      }
    } catch (refreshErr) {
      // Ignore refresh error
    }
  }

  let data: any;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${text.slice(0, 120)}`);
    }
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T = any>(endpoint: string, body?: any) => request<T>(endpoint, 'POST', body),
  patch: <T = any>(endpoint: string, body?: any) => request<T>(endpoint, 'PATCH', body),
  put: <T = any>(endpoint: string, body?: any) => request<T>(endpoint, 'PUT', body),
  delete: <T = any>(endpoint: string) => request<T>(endpoint, 'DELETE'),
  baseUrl: API_BASE_URL,
};
