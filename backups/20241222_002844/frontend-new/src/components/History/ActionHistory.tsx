import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Info as InfoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Action {
  id: number;
  user: string;
  action_type: string;
  entity_type: string;
  entity_id: number;
  changes: any;
  created_at: string;
}

interface ActionHistoryProps {
  entityType?: string;
  entityId?: number;
}

const ActionHistory: React.FC<ActionHistoryProps> = ({ entityType, entityId }) => {
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [entityType, entityId]);

  const fetchHistory = async () => {
    try {
      let url = '/api/history';
      const params = new URLSearchParams();
      
      if (entityType) params.append('entity_type', entityType);
      if (entityId) params.append('entity_id', entityId.toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      setActions(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'vehicle':
        return 'Véhicule';
      case 'note':
        return 'Note';
      case 'maintenance':
        return 'Maintenance';
      default:
        return entity;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'name':
        return 'Nom';
      case 'description':
        return 'Description';
      case 'brand':
        return 'Marque';
      case 'model':
        return 'Modèle';
      case 'year':
        return 'Année';
      case 'license_plate':
        return 'Plaque d\'immatriculation';
      case 'status':
        return 'Statut';
      case 'parking_spot':
        return 'Place de parking';
      case 'content':
        return 'Contenu';
      default:
        return field;
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
        return 'À réparer';
      case 'needs_cleaning':
        return 'À laver';
      default:
        return status;
    }
  };

  const formatValue = (field: string, value: any) => {
    if (typeof value === 'object' && (value.old !== undefined || value.new !== undefined)) {
      return value;
    }

    if (field === 'status') {
      return getStatusLabel(value);
    }

    return value || '-';
  };

  const handleShowDetails = (action: Action) => {
    setSelectedAction(action);
    setIsDetailsOpen(true);
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete('/api/history');
      setActions([]);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Historique des actions
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearHistory}
          startIcon={<DeleteIcon />}
        >
          Effacer l'historique
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Détails</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell>{formatDate(action.created_at)}</TableCell>
                <TableCell>{action.user}</TableCell>
                <TableCell>
                  <Chip
                    label={getActionLabel(action.action_type)}
                    color={getActionColor(action.action_type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{getEntityLabel(action.entity_type)}</TableCell>
                <TableCell>
                  <Tooltip title="Voir les détails">
                    <IconButton
                      size="small"
                      onClick={() => handleShowDetails(action)}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails de l'action
        </DialogTitle>
        <DialogContent>
          {selectedAction && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Date : {formatDate(selectedAction.created_at)}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Utilisateur : {selectedAction.user}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Action : {getActionLabel(selectedAction.action_type)}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Type : {getEntityLabel(selectedAction.entity_type)}
              </Typography>
              
              {selectedAction.changes && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Modifications :
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Champ</TableCell>
                          <TableCell>Ancienne valeur</TableCell>
                          <TableCell>Nouvelle valeur</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedAction.changes).map(([field, value]: [string, any]) => {
                          // S'assurer que la valeur est un objet avec old et new
                          const oldValue = typeof value === 'object' ? value.old : value;
                          const newValue = typeof value === 'object' ? value.new : value;
                          
                          // Formater les valeurs selon le type de champ
                          const formattedOldValue = field === 'status' ? getStatusLabel(oldValue) : oldValue;
                          const formattedNewValue = field === 'status' ? getStatusLabel(newValue) : newValue;
                          
                          return (
                            <TableRow key={field}>
                              <TableCell>{getFieldLabel(field)}</TableCell>
                              <TableCell>{formattedOldValue || '-'}</TableCell>
                              <TableCell>{formattedNewValue || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailsOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActionHistory;
