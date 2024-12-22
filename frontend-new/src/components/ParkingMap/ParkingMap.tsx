import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import { DirectionsCar as ParkingIcon } from '@mui/icons-material';
import { Vehicle } from '../../types/Vehicle';

const statusMap = {
  available: { color: '#4caf50', label: 'Disponible' },
  rented: { color: '#2196f3', label: 'En location' },
  maintenance: { color: '#ff9800', label: 'En maintenance' },
  needs_repair: { color: '#f44336', label: 'À réparer' },
  needs_cleaning: { color: '#9c27b0', label: 'À nettoyer' }
} as const;

const ParkingMap: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des véhicules:', err);
      setError('Erreur lors de la récupération des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotClick = (spotId: string, vehicle: Vehicle | null) => {
    setSelectedSpot(spotId);
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedSpot(null);
    setSelectedVehicle(null);
  };

  const renderVehicleCard = (vehicle: Vehicle) => (
    <Box sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5
    }}>
      <Typography 
        sx={{ 
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#1a237e',
          textAlign: 'center',
          width: '100%',
          overflow: 'visible',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        }}
      >
        {vehicle.license_plate}
      </Typography>
      <Typography 
        sx={{ 
          fontSize: '0.8rem',
          color: '#37474f',
          textAlign: 'center'
        }}
      >
        {vehicle.brand} {vehicle.model}
      </Typography>
      <Chip
        label={statusMap[vehicle.status as keyof typeof statusMap]?.label || vehicle.status}
        size="small"
        sx={{
          backgroundColor: statusMap[vehicle.status as keyof typeof statusMap]?.color || '#9e9e9e',
          color: 'white',
          fontSize: '0.7rem',
          height: '20px'
        }}
      />
    </Box>
  );

  const renderParkingSpot = (spotId: string) => {
    const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
    const vehicle = vehiclesList.find(v => v?.parking_spot === spotId);
    
    return (
      <Box
        key={spotId}
        onClick={() => handleSpotClick(spotId, vehicle || null)}
        sx={{
          minHeight: '150px',
          position: 'relative',
          '&:hover': {
            '& .parking-spot': {
              borderColor: '#1976d2',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }
          }
        }}
      >
        <Paper
          className="parking-spot"
          sx={{
            height: '140px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: vehicle ? 'white' : '#f5f5f5',
            borderRadius: '8px',
            border: '2px dashed',
            borderColor: vehicle ? '#e0e0e0' : '#bdbdbd',
            p: 1,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <Typography 
            sx={{ 
              position: 'absolute',
              top: '8px',
              left: '8px',
              color: '#37474f', 
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {spotId}
          </Typography>
          
          {vehicle ? (
            renderVehicleCard(vehicle)
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <ParkingIcon sx={{ 
                color: '#e0e0e0', 
                fontSize: 32,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
              }} />
              <Typography sx={{ color: '#9e9e9e', fontSize: '0.8rem' }}>
                Libre
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex',
        gap: 4,
        justifyContent: 'center'
      }}>
        {/* Côté gauche - Places 43 à 21 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 3,
          flex: 1
        }}>
          {Array.from({ length: 23 }, (_, i) => String(43 - i)).map(spotId => (
            renderParkingSpot(spotId)
          ))}
        </Box>

        {/* Zone centrale - représentant la route */}
        <Box sx={{ 
          width: '60px',
          backgroundColor: '#e0e0e0',
          borderRadius: '8px',
          margin: '0 2rem'
        }} />

        {/* Côté droit - Places 1 à 20 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 3,
          flex: 1
        }}>
          {Array.from({ length: 20 }, (_, i) => String(i + 1)).map(spotId => (
            renderParkingSpot(spotId)
          ))}
        </Box>
      </Box>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedVehicle ? `Véhicule ${selectedVehicle.license_plate}` : `Place ${selectedSpot}`}
        </DialogTitle>
        <DialogContent>
          {selectedVehicle ? (
            <Box>
              <Typography><strong>Marque:</strong> {selectedVehicle.brand}</Typography>
              <Typography><strong>Modèle:</strong> {selectedVehicle.model}</Typography>
              <Typography><strong>Place:</strong> {selectedVehicle.parking_spot}</Typography>
              <Typography><strong>Statut:</strong> {statusMap[selectedVehicle.status as keyof typeof statusMap]?.label || selectedVehicle.status}</Typography>
            </Box>
          ) : (
            <Typography>Place de parking libre</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParkingMap;
