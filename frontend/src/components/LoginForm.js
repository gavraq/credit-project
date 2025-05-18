import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { login as loginApi } from '../services/auth';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';

const LoginForm = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const data = await loginApi(username, password);
      dispatch(loginSuccess({ token: data.token, user: data.user }));
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.detail || 'Login failed'));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 360, mx: 'auto', mt: 8 }}>
      <Typography variant="h2" align="center" gutterBottom>Sign In</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
    </Box>
  );
};

export default LoginForm;
