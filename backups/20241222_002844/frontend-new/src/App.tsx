import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Parking from './pages/Parking';
import History from './pages/History';
import Login from './pages/Login';
import axios from 'axios';

// Configuration de base d'axios
axios.defaults.baseURL = 'http://localhost:5000';

// Composant pour les routes protégées
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  // Configuration du token pour axios
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return <>{children}</>;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const App = () => {
  useEffect(() => {
    // Configuration du token pour axios
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/vehicles"
          element={
            <PrivateRoute>
              <AppLayout>
                <Vehicles />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/parking"
          element={
            <PrivateRoute>
              <AppLayout>
                <Parking />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/history"
          element={
            <PrivateRoute>
              <AppLayout>
                <History />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* Redirection vers la page principale si l'URL n'existe pas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
