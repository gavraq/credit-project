import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { Menu, Notifications, AccountCircle, Add, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';


const TopNavBar = ({ LogoutButton }) => {
  const navigate = useNavigate();
  
  const handleCreateNew = () => navigate('/credit-requests/new');

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#23408e', boxShadow: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Credit Risk Workflow
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button color="inherit">Dashboard</Button>
            <Button color="inherit">My Tasks</Button>
            <Button color="inherit">All Requests</Button>
            <Button color="inherit" startIcon={<Add />} onClick={handleCreateNew}>Create New</Button>
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff', color: '#23408e', fontWeight: 700 }}>A</Avatar>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>admin</Typography>
            <IconButton color="inherit">
              <AccountCircle />
            </IconButton>
            {/* Render LogoutButton at the far right */}
            {LogoutButton && <Box sx={{ ml: 2 }}>{<LogoutButton />}</Box>}
          </Stack>
        </Toolbar>
      </AppBar>

    </>
  );
};

export default TopNavBar;
