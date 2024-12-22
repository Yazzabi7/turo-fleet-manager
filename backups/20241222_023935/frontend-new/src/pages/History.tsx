import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ActionHistory from '../components/History/ActionHistory';

const History = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Historique des actions
        </Typography>
        <ActionHistory />
      </Box>
    </Container>
  );
};

export default History;
