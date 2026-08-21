import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let headers = new Headers(options.headers || {});
  
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  } catch (error) {
    console.debug('No auth session available for apiFetch');
  }

  // Set default content type for JSON if body is provided and content-type isn't set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
};

export const apiGet = (endpoint: string, options?: RequestInit) => 
  apiFetch(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data: any, options?: RequestInit) => 
  apiFetch(endpoint, { 
    ...options, 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
