import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Source as SourceIcon
} from '@mui/icons-material';
import { Origin } from '../../types';
import { originService } from '../../services/api';

const OriginManagement: React.FC = () => {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState<Origin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadOrigins();
  }, []);

  const loadOrigins = async () => {
    try {
      setLoading(true);
      const data = await originService.getAll();
      setOrigins(data);
    } catch (err) {
      setError('Error al cargar orígenes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (origin?: Origin) => {
    if (origin) {
      setEditingOrigin(origin);
      setFormData({
        name: origin.name,
        description: origin.description || '',
        is_active: origin.is_active
      });
    } else {
      setEditingOrigin(null);
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrigin(null);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);
      
      const originData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active
      };

      if (editingOrigin) {
        await originService.update(editingOrigin.id, originData);
        setSuccess('Origen actualizado exitosamente');
      } else {
        await originService.create(originData);
        setSuccess('Origen creado exitosamente');
      }

      await loadOrigins();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el origen');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (origin: Origin) => {
    if (!window.confirm(`¿Está seguro de eliminar el origen "${origin.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await originService.delete(origin.id);
      setSuccess('Origen eliminado exitosamente');
      await loadOrigins();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el origen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (origin: Origin) => {
    try {
      setLoading(true);
      await originService.update(origin.id, {
        is_active: !origin.is_active
      });
      setSuccess(`Origen ${!origin.is_active ? 'activado' : 'desactivado'} exitosamente`);
      await loadOrigins();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del origen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <SourceIcon color="primary" />
          <Typography variant="h5" component="h1">
            Gestión de Orígenes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Origen
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {origins.map((origin) => (
              <TableRow key={origin.id}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {origin.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {origin.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={origin.is_active ? 'Activo' : 'Inactivo'}
                    color={origin.is_active ? 'success' : 'error'}
                    size="small"
                    onClick={() => handleToggleStatus(origin)}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(origin.created_at).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(origin)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(origin)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {origins.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No hay orígenes registrados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingOrigin ? 'Editar Origen' : 'Nuevo Origen'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                name="name"
                label="Nombre del Origen"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="ej: Email, Teléfono, Web, Presencial"
              />

              <TextField
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Descripción detallada del origen del caso"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                  />
                }
                label="Origen activo"
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingOrigin ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default OriginManagement;
