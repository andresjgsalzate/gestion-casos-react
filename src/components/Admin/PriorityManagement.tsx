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
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PriorityHigh as PriorityIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { Priority } from '../../types';
import { priorityService } from '../../services/api';
import { useAuditLogger } from '../../services/auditService';
import { useAuthStore } from '../../store/authStore';

const PriorityManagement: React.FC = () => {
  const { logAction } = useAuditLogger();
  const { user } = useAuthStore();
  
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 3,
    color: '#2196f3',
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

  const priorityLevels = [
    { value: 1, label: 'Crítica', color: '#f44336' },
    { value: 2, label: 'Alta', color: '#ff9800' },
    { value: 3, label: 'Media', color: '#2196f3' },
    { value: 4, label: 'Baja', color: '#4caf50' },
    { value: 5, label: 'Muy Baja', color: '#9e9e9e' }
  ];

  useEffect(() => {
    loadPriorities();
  }, []);

  const loadPriorities = async () => {
    try {
      setLoading(true);
      const data = await priorityService.getAll();
      setPriorities(data);
    } catch (err) {
      setError('Error al cargar prioridades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (priority?: Priority) => {
    if (priority) {
      setEditingPriority(priority);
      setFormData({
        name: priority.name,
        description: priority.description || '',
        level: priority.level,
        color: priority.color,
        is_active: priority.is_active
      });
    } else {
      setEditingPriority(null);
      setFormData({
        name: '',
        description: '',
        level: 3,
        color: '#2196f3',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPriority(null);
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

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const level = e.target.value as number;
    const levelConfig = priorityLevels.find(p => p.value === level);
    setFormData(prev => ({
      ...prev,
      level,
      color: levelConfig?.color || prev.color
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
      
      const priorityData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        level: formData.level,
        color: formData.color,
        is_active: formData.is_active
      };

      let priorityId: string;
      
      if (editingPriority) {
        const oldData = { ...editingPriority };
        const updatedPriority = await priorityService.update(editingPriority.id, priorityData);
        priorityId = updatedPriority.id;
        
        // Registrar auditoría para actualización
        await logAction(
          'priorities',
          'UPDATE',
          priorityId,
          user?.id,
          `Prioridad actualizada: ${priorityData.name}`,
          oldData,
          priorityData
        );
        
        setSuccess('Prioridad actualizada exitosamente');
      } else {
        const newPriority = await priorityService.create(priorityData);
        priorityId = newPriority.id;
        
        // Registrar auditoría para creación
        await logAction(
          'priorities',
          'INSERT',
          priorityId,
          user?.id,
          `Prioridad creada: ${priorityData.name}`,
          undefined,
          priorityData
        );
        
        setSuccess('Prioridad creada exitosamente');
      }

      await loadPriorities();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la prioridad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (priority: Priority) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar la prioridad "${priority.name}"?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          
          await priorityService.delete(priority.id);
          
          // Registrar auditoría para eliminación
          await logAction(
            'priorities',
            'DELETE',
            priority.id,
            user?.id,
            `Prioridad eliminada: ${priority.name}`,
            priority,
            undefined
          );
          
          setSuccess('Prioridad eliminada exitosamente');
          await loadPriorities();
        } catch (err: any) {
          setError(err.message || 'Error al eliminar la prioridad');
        } finally {
          setLoading(false);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleToggleStatus = async (priority: Priority) => {
    try {
      setLoading(true);
      await priorityService.update(priority.id, {
        is_active: !priority.is_active
      });
      setSuccess(`Prioridad ${!priority.is_active ? 'activada' : 'desactivada'} exitosamente`);
      await loadPriorities();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado de la prioridad');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityChip = (priority: Priority) => {
    const levelConfig = priorityLevels.find(p => p.value === priority.level);
    return (
      <Chip
        label={`${priority.name} (${levelConfig?.label || 'N/A'})`}
        size="small"
        style={{ 
          backgroundColor: priority.color,
          color: 'white',
          fontWeight: 'bold'
        }}
      />
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <PriorityIcon color="primary" />
          <Typography variant="h5" component="h1">
            Gestión de Prioridades
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Prioridad
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
              <TableCell>Prioridad</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Nivel</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {priorities
              .sort((a, b) => a.level - b.level)
              .map((priority) => (
              <TableRow key={priority.id}>
                <TableCell>
                  {getPriorityChip(priority)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {priority.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {priority.level}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={priority.is_active ? 'Activa' : 'Inactiva'}
                    color={priority.is_active ? 'success' : 'error'}
                    size="small"
                    onClick={() => handleToggleStatus(priority)}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(priority.created_at).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(priority)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(priority)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {priorities.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No hay prioridades registradas
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
            {editingPriority ? 'Editar Prioridad' : 'Nueva Prioridad'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                name="name"
                label="Nombre de la Prioridad"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="ej: Urgente, Normal, Baja"
              />

              <TextField
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Descripción de cuándo usar esta prioridad"
              />

              <FormControl fullWidth>
                <InputLabel>Nivel de Prioridad</InputLabel>
                <Select
                  value={formData.level}
                  onChange={handleSelectChange}
                  label="Nivel de Prioridad"
                >
                  {priorityLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          width={16}
                          height={16}
                          borderRadius="50%"
                          bgcolor={level.color}
                        />
                        {level.value} - {level.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  name="color"
                  label="Color"
                  type="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
                <Box
                  width={40}
                  height={40}
                  bgcolor={formData.color}
                  borderRadius={1}
                  border="1px solid #ccc"
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                  />
                }
                label="Prioridad activa"
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
              {editingPriority ? 'Actualizar' : 'Crear'}
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

export default PriorityManagement;
