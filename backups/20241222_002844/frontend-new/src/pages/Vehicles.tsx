import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  status: string;
  parking_spot: string | null;
}

interface VehicleFormData {
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  parking_spot: string;
  status: string;
}

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [formData, setFormData] = useState<VehicleFormData>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    parking_spot: '',
    status: 'available',
  });

  useEffect(() => {
    // Configuration du token pour axios
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      showSnackbar('Erreur lors de la récupération des véhicules', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (vehicle: Vehicle | null = null) => {
    if (vehicle) {
      setFormData(vehicle);
      setSelectedVehicle(vehicle);
    } else {
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        parking_spot: '',
        status: 'available',
      });
      setSelectedVehicle(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVehicle(null);
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      parking_spot: '',
      status: 'available',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedVehicle) {
        await axios.put(`/api/vehicles/${selectedVehicle.id}`, formData);
        showSnackbar('Véhicule modifié avec succès', 'success');
      } else {
        await axios.post('/api/vehicles', formData);
        showSnackbar('Véhicule ajouté avec succès', 'success');
      }
      fetchVehicles();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du véhicule:', error);
      showSnackbar(
        error.response?.data?.error || 'Erreur lors de l\'enregistrement du véhicule',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await axios.delete(`/api/vehicles/${id}`);
        showSnackbar('Véhicule supprimé avec succès', 'success');
        fetchVehicles();
      } catch (error) {
        console.error('Erreur lors de la suppression du véhicule:', error);
        showSnackbar('Erreur lors de la suppression du véhicule', 'error');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'rented':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'needs_repair':
        return 'error';
      case 'needs_cleaning':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'rented':
        return 'Loué';
      case 'maintenance':
        return 'En maintenance';
      case 'needs_repair':
        return 'Réparation nécessaire';
      case 'needs_cleaning':
        return 'Nettoyage nécessaire';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Véhicules
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Ajouter un véhicule
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Marque</TableCell>
              <TableCell>Modèle</TableCell>
              <TableCell>Année</TableCell>
              <TableCell>Plaque</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Place</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>{vehicle.brand}</TableCell>
                <TableCell>{vehicle.model}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>{vehicle.license_plate}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(vehicle.status)}
                    color={getStatusColor(vehicle.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{vehicle.parking_spot || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(vehicle)}
                    title="Modifier"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(vehicle.id)}
                    title="Supprimer"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        keepMounted
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoFocus
                  label="Marque"
                  fullWidth
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Modèle"
                  fullWidth
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Année"
                  type="number"
                  fullWidth
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Plaque d'immatriculation"
                  fullWidth
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Place de parking"
                  fullWidth
                  value={formData.parking_spot}
                  onChange={(e) => setFormData({ ...formData, parking_spot: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Statut</InputLabel>
                  <Select
                    labelId="status-label"
                    value={formData.status}
                    label="Statut"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="available">Disponible</MenuItem>
                    <MenuItem value="rented">Loué</MenuItem>
                    <MenuItem value="maintenance">En maintenance</MenuItem>
                    <MenuItem value="needs_repair">À réparer</MenuItem>
                    <MenuItem value="needs_cleaning">À laver</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Chargement...' : (selectedVehicle ? 'Modifier' : 'Ajouter')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Vehicles;
