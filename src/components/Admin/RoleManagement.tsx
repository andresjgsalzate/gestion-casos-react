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
  Chip,
  IconButton,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';

import { roleService, permissionService } from '../../services/api';
import { Role, Permission } from '../../types';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getAll(),
        permissionService.getAll(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (role?: Role) => {
    if (role) {
      setLoadingPermissions(true);
      // Obtener los datos completos del rol con permisos
      try {
        const fullRole = await roleService.getById(role.id);
        if (fullRole) {
          setSelectedRole(fullRole);
          setFormData({
            name: fullRole.name,
            description: fullRole.description || '',
          });
          
          // Obtener permisos del rol desde role_permissions
          let permissionIds: string[] = [];
          
          if (fullRole.role_permissions) {
            permissionIds = fullRole.role_permissions.map(rp => {
              // Si rp.permissions existe (estructura completa)
              if (rp.permissions && rp.permissions.id) {
                return rp.permissions.id;
              }
              // Si solo tenemos permission_id (estructura simple)
              if (rp.permission_id) {
                return rp.permission_id;
              }
              return null;
            }).filter(Boolean) as string[];
          }
          
          setSelectedPermissions(permissionIds);
        }
      } catch (error) {
        console.error('Error loading role details:', error);
        toast.error('Error al cargar los detalles del rol');
      } finally {
        setLoadingPermissions(false);
      }
    } else {
      setSelectedRole(null);
      setFormData({
        name: '',
        description: '',
      });
      setSelectedPermissions([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRole(null);
  };

  const handleSave = async () => {
    try {
      let roleId: string;
      
      if (selectedRole) {
        const updatedRole = await roleService.update(selectedRole.id, formData);
        roleId = updatedRole.id;
        toast.success('Rol actualizado exitosamente');
      } else {
        const newRole = await roleService.create({
          ...formData
        });
        roleId = newRole.id;
        toast.success('Rol creado exitosamente');
      }

      // Asignar permisos
      await roleService.assignPermissions(roleId, selectedPermissions);

      handleCloseDialog();
      loadData();
    } catch (error) {
      toast.error('Error al guardar el rol');
      console.error(error);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (window.confirm('¿Está seguro de eliminar este rol?')) {
      try {
        await roleService.delete(roleId);
        toast.success('Rol eliminado exitosamente');
        loadData();
      } catch (error) {
        toast.error('Error al eliminar el rol');
        console.error(error);
      }
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nombre', width: 200, flex: 1 },
    { field: 'description', headerName: 'Descripción', width: 300 },
    {
      field: 'permissions_count',
      headerName: 'Permisos',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.role_permissions?.length || 0}
          color="primary"
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
      width: 120,
      renderCell: (params) => (
        <Box>
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

  // Agrupar permisos por módulo
  const permissionsByModule = permissions.reduce((acc, permission) => {
    const module = permission.module || 'general';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Gestión de Roles</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Rol
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={roles}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog para crear/editar rol */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Editar Rol' : 'Nuevo Rol'}
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
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Permisos {loadingPermissions && '(Cargando...)'}
              </Typography>
              <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 2 }}>
                {loadingPermissions ? (
                  <Typography color="text.secondary">Cargando permisos...</Typography>
                ) : (
                  Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                    <Box key={module} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {module.toUpperCase()}
                      </Typography>
                      <FormGroup>
                        {modulePermissions.map((permission) => (
                          <FormControlLabel
                            key={permission.id}
                            control={
                              <Checkbox
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                              />
                            }
                            label={`${permission.name} - ${permission.description}`}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedRole ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
