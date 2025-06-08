import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { Notifications, Add } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle'; // Keep if needed elsewhere, or remove if only for old logout
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // Added useDispatch
import logo from '../icbcs_logo.jpg'; // Import the logo
import { logout } from '../store/authSlice'; // Assuming this is the path to your logout action


const TopNavBar = () => { // Removed LogoutButton prop
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    // navigate('/login'); // Optional: redirect to login after logout
  };
  
  const handleCreateNew = () => navigate('/credit-requests/new');
  const handleNavigateToDashboard = () => navigate('/'); // Handler for Dashboard navigation

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#23408e', boxShadow: 2 }}>
        <Toolbar>
          <img src={logo} alt="ICBCS Logo" style={{ height: '40px', marginRight: '16px' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Credit Risk Workflow
          </Typography>
          {/* This Box will push subsequent items to the right */}
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            <Button color="inherit" onClick={handleNavigateToDashboard}>Dashboard</Button>
            <Button color="inherit">My Tasks</Button>
            <Button color="inherit">All Requests</Button>
            <Button color="inherit" startIcon={<Add />} onClick={handleCreateNew}>Create New</Button>
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
            <Button 
              onClick={handleMenuOpen} 
              sx={{ color: 'white', textTransform: 'none' }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff', color: '#23408e', fontWeight: 700, mr: 1 }}>
                {user && user.username ? user.username.charAt(0).toUpperCase() : (user && user.name ? user.name.charAt(0).toUpperCase() : 'U')}
              </Avatar>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                {user && user.username ? user.username : (user && user.name ? user.name : 'User')}
              </Typography>
              <ArrowDropDownIcon />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

    </>
  );
};

export default TopNavBar;
