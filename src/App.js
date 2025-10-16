import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import ModeSelectionPage from './ModeSelectionPage';
import AICXHelperInterface from './AICXHelperInterface';
import AssessmentPage from './AssessmentPage';
import AssessmentDashboardPage from './AssessmentDashboardPage';
import LoginPage from './LoginPage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#000000', // Black
    },
    secondary: {
      main: '#f50057', // A contrasting color (pink/red)
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    allVariants: {
      color: '#ffffff', // Ensure text is visible on dark background
    },
  },
});

// Wrapper component to extract agent from query params
function AICXHelperInterfaceWrapper() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const agentId = queryParams.get('agent');
  return <AICXHelperInterface agentId={agentId} />;
}

function AssessmentPageWrapper() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const agentId = queryParams.get('agent');
  return <AssessmentPage agentId={agentId} />;
}

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('userEmail');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const email = localStorage.getItem('userEmail');
  if (!email.endsWith('@ajobthing.com')) {
    localStorage.removeItem('userEmail');
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><ModeSelectionPage /></PrivateRoute>} />
          <Route path="/assist" element={<PrivateRoute><AICXHelperInterfaceWrapper /></PrivateRoute>} />
          <Route path="/assessment" element={<PrivateRoute><AssessmentPageWrapper /></PrivateRoute>} />
          <Route path="/assessment/dashboard" element={<PrivateRoute><AssessmentDashboardPage /></PrivateRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;