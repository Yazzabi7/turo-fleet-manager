import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  StickyNote2 as NoteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface VehicleNotesProps {
  vehicleId: number;
}

const VehicleNotes: React.FC<VehicleNotesProps> = ({ vehicleId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [vehicleId]);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`/api/vehicles/${vehicleId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      setError('Erreur lors de la récupération des notes');
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      setError('Le contenu de la note ne peut pas être vide');
      return;
    }
    
    try {
      await axios.post(`/api/vehicles/${vehicleId}/notes`, {
        content: newNoteContent.trim(),
      });
      setNewNoteContent('');
      setIsAddDialogOpen(false);
      setError(null);
      fetchNotes();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      setError('Erreur lors de l\'ajout de la note');
    }
  };

  const handleEditNote = async () => {
    if (!selectedNote || !newNoteContent.trim()) {
      setError('Le contenu de la note ne peut pas être vide');
      return;
    }
    
    try {
      await axios.put(`/api/vehicles/${vehicleId}/notes/${selectedNote.id}`, {
        content: newNoteContent.trim(),
      });
      setNewNoteContent('');
      setIsEditDialogOpen(false);
      setSelectedNote(null);
      setError(null);
      fetchNotes();
    } catch (error) {
      console.error('Erreur lors de la modification de la note:', error);
      setError('Erreur lors de la modification de la note');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    
    try {
      await axios.delete(`/api/vehicles/${vehicleId}/notes/${noteId}`);
      fetchNotes();
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      setError('Erreur lors de la suppression de la note');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NoteIcon color="primary" />
          Notes ({notes.length})
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={() => {
            setNewNoteContent('');
            setError(null);
            setIsAddDialogOpen(true);
          }}
        >
          Ajouter une note
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Aucune note pour ce véhicule
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {notes.map((note) => (
            <Paper
              key={note.id}
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: '#f8f9fa',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    flex: 1,
                    mr: 1
                  }}
                >
                  {note.content}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Modifier">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedNote(note);
                        setNewNoteContent(note.content);
                        setError(null);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                {formatDate(note.created_at)}
                {note.updated_at !== note.created_at && ' (modifié)'}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog pour ajouter une note */}
      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter une note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            label="Contenu de la note"
            fullWidth
            variant="outlined"
            margin="dense"
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleAddNote} variant="contained">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour modifier une note */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier la note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            label="Contenu de la note"
            fullWidth
            variant="outlined"
            margin="dense"
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditNote} variant="contained">
            Modifier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleNotes;
