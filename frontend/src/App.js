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
import PrioritizationDashboard from './components/PrioritizationDashboard';
import TopNavBar from './components/TopNavBar';
import CreditRequestForm from './components/CreditRequestForm/index';
import CreditReviewForm from './components/CreditReviewForm/index';
import BusinessSponsorshipForm from './components/BusinessSponsorshipForm/index';
import CreditQuestionnaireForm from './components/CreditQuestionnaireForm/index';
import ApplicationLoader from './components/ApplicationLoader';
import ApplicationDetails from './components/ApplicationDetails';
import MyTasks from './components/MyTasks';

function Dashboard() {
  return (
    <div className="App">
      <TopNavBar LogoutButton={LogoutButton} />
      <RequestTrackingDashboard />
    </div>
  );
}

function PrioritizationPage() {
  return (
    <div className="App">
      <TopNavBar LogoutButton={LogoutButton} />
      <PrioritizationDashboard />
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
          <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          <Route path="/prioritization" element={<ProtectedRoute><PrioritizationPage /></ProtectedRoute>} />
          <Route path="/credit-requests/new" element={<ProtectedRoute><CreditRequestForm editMode={true} /></ProtectedRoute>} />
          <Route path="/credit-requests/:id/edit" element={<ProtectedRoute><ApplicationLoader /></ProtectedRoute>} />
          <Route path="/credit-requests/:id/details" element={<ProtectedRoute><ApplicationDetails /></ProtectedRoute>} />
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
