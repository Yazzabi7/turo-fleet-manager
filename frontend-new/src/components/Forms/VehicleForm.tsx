import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  onSuccess: () => void;
  vehicleId?: number;
  isEditing?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  onSuccess,
  vehicleId,
  isEditing,
}) => {
  const [formData, setFormData] = React.useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    status: 'available',
    parking_spot: '',
  });

  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        status: 'available',
        parking_spot: '',
      });
    }
    setError(null);
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.brand.trim()) {
      setError('La marque est requise');
      return false;
    }
    if (!formData.model.trim()) {
      setError('Le modèle est requis');
      return false;
    }
    if (!formData.license_plate.trim()) {
      setError('La plaque d\'immatriculation est requise');
      return false;
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      setError('L\'année n\'est pas valide');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await axios({
        method: isEditing ? 'put' : 'post',
        url: isEditing ? `/api/vehicles/${vehicleId}` : '/api/vehicles',
        data: {
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          license_plate: formData.license_plate,
          status: formData.status,
          parking_spot: formData.parking_spot
        }
      });

      if (response.status === 200 || response.status === 201) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        if (err.response.data.details) {
          setError(`${err.response.data.error} - ${err.response.data.details}`);
        }
      } else {
        setError('Une erreur est survenue lors de la sauvegarde du véhicule');
      }
    }
  };

  const statusOptions = [
    { value: 'available', label: 'Disponible' },
    { value: 'rented', label: 'Loué' },
    { value: 'maintenance', label: 'En maintenance' },
    { value: 'needs_repair', label: 'À réparer' },
    { value: 'needs_cleaning', label: 'À laver' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="brand"
                label="Marque"
                value={formData.brand}
                onChange={handleChange}
                fullWidth
                required
                error={!!error && !formData.brand.trim()}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label="Modèle"
                value={formData.model}
                onChange={handleChange}
                fullWidth
                required
                error={!!error && !formData.model.trim()}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="year"
                label="Année"
                type="number"
                value={formData.year}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ 
                  min: 1900, 
                  max: new Date().getFullYear() + 1,
                  step: 1
                }}
                error={!!error && (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="license_plate"
                label="Plaque d'immatriculation"
                value={formData.license_plate}
                onChange={handleChange}
                fullWidth
                required
                error={!!error && !formData.license_plate.trim()}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="status"
                label="Statut"
                select
                value={formData.status}
                onChange={handleChange}
                fullWidth
                required
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="parking_spot"
                label="Place de parking"
                value={formData.parking_spot}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default VehicleForm;
