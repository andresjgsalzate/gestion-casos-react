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
  Security as SecurityIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { Permission } from '../../types';
import { permissionService } from '../../services/api';

const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: '',
    action: ''
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

  const modules = [
    'cases',
    'classification',
    'todos',
    'reports',
    'administration',
    'users',
    'system'
  ];

  const actions = [
    'create',
    'read',
    'update',
    'delete',
    'export',
    'manage',
    'view_all',
    'assign'
  ];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionService.getAll();
      setPermissions(data);
    } catch (err) {
      setError('Error al cargar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        description: permission.description || '',
        module: permission.module || '',
        action: permission.action || ''
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: '',
        description: '',
        module: '',
        action: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPermission(null);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      
      const permissionData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        module: formData.module || undefined,
        action: formData.action || undefined
      };

      if (editingPermission) {
        await permissionService.update(editingPermission.id, permissionData);
        setSuccess('Permiso actualizado exitosamente');
      } else {
        await permissionService.create(permissionData);
        setSuccess('Permiso creado exitosamente');
      }

      await loadPermissions();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el permiso');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el permiso "${permission.name}"?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await permissionService.delete(permission.id);
          setSuccess('Permiso eliminado exitosamente');
          await loadPermissions();
        } catch (err: any) {
          setError(err.message || 'Error al eliminar el permiso');
        } finally {
          setLoading(false);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const getModuleColor = (module: string | null) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      'cases': 'primary',
      'classification': 'secondary',
      'todos': 'success',
      'reports': 'warning',
      'administration': 'error',
      'users': 'info',
      'system': 'primary'
    };
    return colors[module || ''] || 'default';
  };

  const getActionColor = (action: string | null) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      'create': 'success',
      'read': 'info',
      'update': 'warning',
      'delete': 'error',
      'export': 'secondary',
      'manage': 'primary',
      'view_all': 'info',
      'assign': 'primary'
    };
    return colors[action || ''] || 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h5" component="h1">
            Gestión de Permisos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Permiso
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
              <TableCell>Módulo</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {permission.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {permission.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {permission.module ? (
                    <Chip
                      label={permission.module}
                      size="small"
                      color={getModuleColor(permission.module)}
                      variant="outlined"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {permission.action ? (
                    <Chip
                      label={permission.action}
                      size="small"
                      color={getActionColor(permission.action)}
                      variant="outlined"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {new Date(permission.created_at).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(permission)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(permission)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {permissions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No hay permisos registrados
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
            {editingPermission ? 'Editar Permiso' : 'Nuevo Permiso'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                name="name"
                label="Nombre del Permiso"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                placeholder="ej: cases.create, users.manage"
              />

              <TextField
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                placeholder="Descripción del permiso"
              />

              <FormControl fullWidth>
                <InputLabel>Módulo</InputLabel>
                <Select
                  name="module"
                  value={formData.module}
                  onChange={handleSelectChange}
                  label="Módulo"
                >
                  <MenuItem value="">
                    <em>Sin módulo específico</em>
                  </MenuItem>
                  {modules.map((module) => (
                    <MenuItem key={module} value={module}>
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Acción</InputLabel>
                <Select
                  name="action"
                  value={formData.action}
                  onChange={handleSelectChange}
                  label="Acción"
                >
                  <MenuItem value="">
                    <em>Sin acción específica</em>
                  </MenuItem>
                  {actions.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              {editingPermission ? 'Actualizar' : 'Crear'}
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

export default PermissionManagement;
