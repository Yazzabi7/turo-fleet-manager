import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { DirectionsCar as CarIcon } from '@mui/icons-material';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Ne pas afficher la navbar sur la page de login
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <AppBar position="fixed">
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CarIcon />
            <Typography variant="h6" component="div">
              Gestionnaire de Flotte
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/')}
              sx={{
                color: location.pathname === '/' ? 'secondary.main' : 'inherit',
              }}
            >
              Véhicules
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/history')}
              sx={{
                color: location.pathname === '/history' ? 'secondary.main' : 'inherit',
              }}
            >
              Historique
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
