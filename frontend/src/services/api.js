const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let currentUserEmail = localStorage.getItem('user_email') || 'employee.acme@corporate.com';

export const setCurrentUserEmailHeader = (email) => {
  if (email) {
    currentUserEmail = email.trim().toLowerCase();
    localStorage.setItem('user_email', currentUserEmail);
  }
};

export const getCurrentUserEmailHeader = () => currentUserEmail;

export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-User-Email': currentUserEmail,
    'Authorization': `Bearer ${currentUserEmail}`,
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      data?.data?.pickupLocation ||
      data?.data?.destination ||
      (data?.data && typeof data.data === 'object' ? Object.values(data.data).join(', ') : null) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data || { success: true };
};
