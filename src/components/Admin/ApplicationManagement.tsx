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
  Apps as AppsIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { Application } from '../../types';
import { applicationService } from '../../services/api';

const ApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getAll();
      setApplications(data);
    } catch (err) {
      setError('Error al cargar aplicaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (application?: Application) => {
    if (application) {
      setEditingApplication(application);
      setFormData({
        name: application.name,
        description: application.description || '',
        is_active: application.is_active
      });
    } else {
      setEditingApplication(null);
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
    setEditingApplication(null);
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
      
      const applicationData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active
      };

      if (editingApplication) {
        await applicationService.update(editingApplication.id, applicationData);
        setSuccess('Aplicación actualizada exitosamente');
      } else {
        await applicationService.create(applicationData);
        setSuccess('Aplicación creada exitosamente');
      }

      await loadApplications();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (application: Application) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar la aplicación "${application.name}"?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await applicationService.delete(application.id);
          setSuccess('Aplicación eliminada exitosamente');
          await loadApplications();
        } catch (err: any) {
          setError(err.message || 'Error al eliminar la aplicación');
        } finally {
          setLoading(false);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleToggleStatus = async (application: Application) => {
    try {
      setLoading(true);
      await applicationService.update(application.id, {
        is_active: !application.is_active
      });
      setSuccess(`Aplicación ${!application.is_active ? 'activada' : 'desactivada'} exitosamente`);
      await loadApplications();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado de la aplicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <AppsIcon color="primary" />
          <Typography variant="h5" component="h1">
            Gestión de Aplicaciones
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Aplicación
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
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {application.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {application.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={application.is_active ? 'Activa' : 'Inactiva'}
                    color={application.is_active ? 'success' : 'error'}
                    size="small"
                    onClick={() => handleToggleStatus(application)}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(application.created_at).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(application)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(application)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {applications.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No hay aplicaciones registradas
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
            {editingApplication ? 'Editar Aplicación' : 'Nueva Aplicación'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                name="name"
                label="Nombre de la Aplicación"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="ej: Sistema de Gestión de Casos"
              />

              <TextField
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Descripción detallada de la aplicación"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                  />
                }
                label="Aplicación activa"
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
              {editingApplication ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo de confirmación */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            variant="contained"
            color="error"
            startIcon={<CheckIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationManagement;
