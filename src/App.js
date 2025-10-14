
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import ModeSelectionPage from './ModeSelectionPage';
import AICXHelperInterface from './AICXHelperInterface';
import AssessmentPage from './AssessmentPage';
import AssessmentDashboardPage from './AssessmentDashboardPage';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<ModeSelectionPage />} />
          <Route path="/assist" element={<AICXHelperInterfaceWrapper />} />
          <Route path="/assessment" element={<AssessmentPageWrapper />} />
          <Route path="/assessment/dashboard" element={<AssessmentDashboardPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
