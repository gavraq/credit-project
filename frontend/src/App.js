import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { Provider, useSelector } from 'react-redux';
import store from './store';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import LogoutButton from './components/LogoutButton';
import Typography from '@mui/material/Typography';



import RequestTrackingDashboard from './components/RequestTrackingDashboard';

import TopNavBar from './components/TopNavBar';
import CreditRequestForm from './components/CreditRequestForm';

function Dashboard() {
  return (
    <div className="App">
      <TopNavBar LogoutButton={LogoutButton} />
      <RequestTrackingDashboard />
    </div>
  );
}

function MainApp() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginForm />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/credit-requests/:id/edit" element={<ProtectedRoute><CreditRequestForm editMode={true} /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}

export default App;
