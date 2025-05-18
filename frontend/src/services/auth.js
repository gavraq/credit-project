import api from './api';

export async function login(username, password) {
  // Use SimpleJWT endpoint and response
  const response = await api.post('/token/', { username, password });
  // Return token in the expected format for the rest of the app
  return {
    token: response.data.access,
    refresh: response.data.refresh,
    user: { username }, // Optionally, fetch user details separately if needed
  };
}

export function logout() {
  localStorage.removeItem('jwt');
}
