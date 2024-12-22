import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import WarningIcon from '@mui/icons-material/Warning';
import TimeToLeaveIcon from '@mui/icons-material/TimeToLeave';
import axios from 'axios';

interface DashboardStats {
  total_vehicles: number;
  available_vehicles: number;
  rented_vehicles: number;
  maintenance_vehicles: number;
  needs_repair: number;
  needs_cleaning: number;
  active_rentals: number;
  pending_maintenances: number;
  pending_cleanings: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_vehicles: 0,
    available_vehicles: 0,
    rented_vehicles: 0,
    maintenance_vehicles: 0,
    needs_repair: 0,
    needs_cleaning: 0,
    active_rentals: 0,
    pending_maintenances: 0,
    pending_cleanings: 0,
  });
  
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get<DashboardStats>('http://localhost:5000/api/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      }
    };

    fetchStats();
    // Rafraîchir les stats toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'Total des Véhicules',
      value: stats.total_vehicles,
      icon: <DirectionsCarIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Véhicules Disponibles',
      value: stats.available_vehicles,
      icon: <TimeToLeaveIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Loué',
      value: stats.rented_vehicles,
      icon: <TimeToLeaveIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.info.main,
    },
    {
      title: 'En Maintenance',
      value: stats.maintenance_vehicles,
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'À Réparer',
      value: stats.needs_repair,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
    },
    {
      title: 'À Laver',
      value: stats.needs_cleaning,
      icon: <CleaningServicesIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: card.color, mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h3" component="div" gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
