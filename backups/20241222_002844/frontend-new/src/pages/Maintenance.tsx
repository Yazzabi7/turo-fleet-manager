import React from 'react';
import { Typography, Container } from '@mui/material';

const Maintenance: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Maintenance des Véhicules
      </Typography>
      <Typography variant="body1">
        Page de gestion de la maintenance des véhicules
      </Typography>
    </Container>
  );
};

export default Maintenance;
