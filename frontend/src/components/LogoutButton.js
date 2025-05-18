import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { Button } from '@mui/material';

const LogoutButton = () => {
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
  };
  return (
    <Button variant="outlined" color="secondary" onClick={handleLogout} sx={{ ml: 2 }}>
      Logout
    </Button>
  );
};

export default LogoutButton;
