import { createSlice } from '@reduxjs/toolkit';
import { logout as logoutService } from '../services/auth';

const token = localStorage.getItem('jwt');
const refreshToken = localStorage.getItem('jwt_refresh');
let user = null;
const storedUserDetails = localStorage.getItem('user_details');
if (storedUserDetails) {
  try {
    user = JSON.parse(storedUserDetails);
  } catch {
    localStorage.removeItem('user_details'); // Clear corrupted data
  }
} else if (token) {
  // Fallback to decoding from token if no separate user_details, though this won't have full name
  try {
    user = JSON.parse(atob(token.split('.')[1]));
  } catch {
    user = null;
  }
}

const initialState = {
  token: token || null,
  refreshToken: refreshToken || null,
  user: user || null,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.token = action.payload.access; // simplejwt uses 'access' for the access token
      state.refreshToken = action.payload.refresh;
      state.user = action.payload.user;
      localStorage.setItem('user_details', JSON.stringify(action.payload.user));
      state.isAuthenticated = true;
      // Note: We're now storing tokens in the auth service instead of here
      // This ensures consistent token management across the application
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      localStorage.removeItem('user_details');
      state.isAuthenticated = false;
      // Call the logout service to handle token removal and redirection
      logoutService();
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
