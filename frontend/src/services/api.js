const API_BASE_URL = 'http://localhost:8080/api/v1';

let currentUserEmail = 'employee.acme@corporate.com';

export const setCurrentUserEmailHeader = (email) => {
  currentUserEmail = email;
};

export const getCurrentUserEmailHeader = () => currentUserEmail;

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Email': currentUserEmail,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.data?.pickupLocation || data?.data?.destination || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data;
};
