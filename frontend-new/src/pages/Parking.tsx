import React, { useState, useEffect } from 'react';
import { Container, Paper } from '@mui/material';
import ParkingMap from '../components/ParkingMap/ParkingMap';
import axios from 'axios';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  license_plate: string;
  parking_spot: string | null;
  status: string;
}

const Parking: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mt: 3 }}>
        <ParkingMap vehicles={vehicles} fetchVehicles={fetchVehicles} />
      </Paper>
    </Container>
  );
};

export default Parking;
