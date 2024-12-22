import React from 'react';
import { Typography, Container } from '@mui/material';

const Rentals: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion des Locations
      </Typography>
      <Typography variant="body1">
        Page de gestion des locations de véhicules
      </Typography>
    </Container>
  );
};

export default Rentals;
