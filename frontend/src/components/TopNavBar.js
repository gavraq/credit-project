import React, { useState } from 'react';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CreditRequestForm from './CreditRequestForm';

const TopNavBar = ({ LogoutButton }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
            <Button color="inherit" startIcon={<Add />} onClick={handleOpen}>Create New</Button>
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
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
          New Credit Request
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <CreditRequestForm />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopNavBar;
