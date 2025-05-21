import { createSlice } from '@reduxjs/toolkit';
import { logout as logoutService } from '../services/auth';

const token = localStorage.getItem('jwt');
const refreshToken = localStorage.getItem('jwt_refresh');
const user = token ? JSON.parse(atob(token.split('.')[1])) : null;

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
      state.token = action.payload.token;
      state.refreshToken = action.payload.refresh;
      state.user = action.payload.user;
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
      state.isAuthenticated = false;
      // Call the logout service to handle token removal and redirection
      logoutService();
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
