import api from './api';

export async function login(username, password) {
  // Use SimpleJWT endpoint and response
  const response = await api.post('/api/token/', { username, password });
  
  // Store tokens in localStorage
  localStorage.setItem('jwt', response.data.access);
  localStorage.setItem('jwt_refresh', response.data.refresh);
  
  // Return token in the expected format for the rest of the app
  return {
    access: response.data.access, // Use 'access' key
    refresh: response.data.refresh,
    user: response.data.user,    // Return the full user object from the API response
  };
}

export function logout() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('jwt_refresh');
  window.location.href = '/login';
}
