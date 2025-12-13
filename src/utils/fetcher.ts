// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Universal fetcher for useSWR that handles both relative and absolute URLs
 * @param url - The URL to fetch (can be relative or absolute)
 * @returns Promise with the JSON response
 */
export const fetcher = (url: string) => {
  // If the URL is already absolute, use it as is
  if (url.startsWith('http')) {
    return fetch(url).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  }
  
  // Otherwise, prepend the API base URL
  return fetch(`${API_BASE_URL}${url}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};

/**
 * Fetcher with authentication headers
 * @param url - The URL to fetch
 * @returns Promise with the JSON response
 */
export const authFetcher = (url: string) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If the URL is already absolute, use it as is
  if (url.startsWith('http')) {
    return fetch(url, { headers }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  }
  
  // Otherwise, prepend the API base URL
  return fetch(`${API_BASE_URL}${url}`, { headers }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};

/**
 * Fetcher for POST requests
 * @param url - The URL to fetch
 * @param data - The data to send
 * @returns Promise with the JSON response
 */
export const postFetcher = (url: string, data: any) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};

/**
 * Fetcher for PUT requests
 * @param url - The URL to fetch
 * @param data - The data to send
 * @returns Promise with the JSON response
 */
export const putFetcher = (url: string, data: any) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};

/**
 * Fetcher for DELETE requests
 * @param url - The URL to fetch
 * @returns Promise with the JSON response
 */
export const deleteFetcher = (url: string) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    method: 'DELETE',
    headers,
  }).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};
