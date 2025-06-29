import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';

import { userService, roleService } from '../../services/api';
import { useReferentialIntegrity } from '../../hooks/useReferentialIntegrity';
import { validatePassword } from '../../utils/passwordUtils';
import { useAuthStore } from '../../store/authStore';
import { User, Role, UserFormData } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role_id: '',
    password: '',
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

  const { safeExecute } = useReferentialIntegrity();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userService.getAll(),
        roleService.getAll(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        password: '', // No mostrar contraseña existente por seguridad
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        name: '',
        role_id: '',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async () => {
    // Validaciones básicas
    if (!formData.email?.trim()) {
      toast.error('El email es requerido');
      return;
    }
    if (!formData.name?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.role_id) {
      toast.error('El rol es requerido');
      return;
    }

    // Validación de contraseña
    if (!selectedUser && !formData.password?.trim()) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (formData.password?.trim()) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.message || 'Contraseña no válida');
        return;
      }
    }

    const result = await safeExecute(async () => {
      if (selectedUser) {
        // Al editar, solo enviar password si se proporcionó una nueva
        const updateData: Partial<UserFormData> = {
          email: formData.email,
          name: formData.name,
          role_id: formData.role_id
        };
        
        if (formData.password?.trim()) {
          updateData.password = formData.password;
        }
        
        await userService.update(selectedUser.id, updateData);
        return 'actualizado';
      } else {
        // Al crear, todos los campos son requeridos
        await userService.create(formData);
        return 'creado';
      }
    }, 'Guardar usuario');

    if (result) {
      toast.success(`Usuario ${result} exitosamente`);
      handleCloseDialog();
      loadData();
    }
  };

  const handleDelete = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.name || 'este usuario';
    
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el usuario "${userName}"?`,
      onConfirm: async () => {
        const result = await safeExecute(async () => {
          await userService.delete(userId);
          return true;
        }, 'Eliminar usuario');

        if (result) {
          toast.success('Usuario eliminado exitosamente');
          loadData();
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const result = await safeExecute(async () => {
      await userService.toggleActive(userId, !isActive);
      return !isActive ? 'activado' : 'desactivado';
    }, 'Cambiar estado de usuario');

    if (result) {
      toast.success(`Usuario ${result} exitosamente`);
      loadData();
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Sin rol';
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nombre', width: 200, flex: 1 },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'role_id',
      headerName: 'Rol',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={getRoleName(params.value)}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activo' : 'Inactivo'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Fecha Creación',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 180,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleToggleActive(params.row.id, params.row.is_active)}
            color={params.row.is_active ? 'error' : 'success'}
          >
            {params.row.is_active ? <DeactivateIcon /> : <ActivateIcon />}
          </IconButton>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Gestión de Usuarios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedUser}
                helperText={selectedUser ? "Dejar vacío para mantener la contraseña actual" : "Mínimo 6 caracteres"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
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

export default UserManagement;
