import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person as UserIcon,
  Security as RoleIcon,
  Security as PermissionIcon,
  Apps as AppIcon,
  Source as OriginIcon,
  Flag as PriorityIcon,
  History as AuditIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Importar componentes de administración individuales
import UserManagement from '../components/Admin/UserManagement';
import RoleManagement from '../components/Admin/RoleManagement';
import PermissionManagement from '../components/Admin/PermissionManagement';
import ApplicationManagement from '../components/Admin/ApplicationManagement';
import OriginManagement from '../components/Admin/OriginManagement';
import PriorityManagement from '../components/Admin/PriorityManagement';
import AuditLogManagement from '../components/Admin/AuditLogManagement';
import ArchiveManagement from '../components/Admin/ArchiveManagement';
import { usePermissions } from '../hooks/usePermissions';

const Administration: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = usePermissions();

  // Determinar el tab activo basado en la ruta
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/users')) setTabValue(0);
    else if (path.includes('/roles')) setTabValue(1);
    else if (path.includes('/permissions')) setTabValue(2);
    else if (path.includes('/applications')) setTabValue(3);
    else if (path.includes('/origins')) setTabValue(4);
    else if (path.includes('/priorities')) setTabValue(5);
    else if (path.includes('/archive')) setTabValue(6);
    else if (path.includes('/audit')) setTabValue(7);
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Navegar a la ruta correspondiente
    const routes = [
      '/admin/users',
      '/admin/roles', 
      '/admin/permissions',
      '/admin/applications',
      '/admin/origins',
      '/admin/priorities',
      '/admin/archive',
      '/admin/audit'
    ];
    navigate(routes[newValue]);
  };

  // Solo admins pueden acceder a administración
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Acceso Denegado
        </Typography>
        <Typography variant="body1">
          No tienes permisos para acceder a esta sección.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administración del Sistema
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<UserIcon />} label="Usuarios" />
            <Tab icon={<RoleIcon />} label="Roles" />
            <Tab icon={<PermissionIcon />} label="Permisos" />
            <Tab icon={<AppIcon />} label="Aplicaciones" />
            <Tab icon={<OriginIcon />} label="Orígenes" />
            <Tab icon={<PriorityIcon />} label="Prioridades" />
            <Tab icon={<ArchiveIcon />} label="Archivo" />
            <Tab icon={<AuditIcon />} label="Auditoría" />
          </Tabs>
        </Box>

        <Routes>
          <Route path="/" element={<UserManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route path="/permissions" element={<PermissionManagement />} />
          <Route path="/applications" element={<ApplicationManagement />} />
          <Route path="/origins" element={<OriginManagement />} />
          <Route path="/priorities" element={<PriorityManagement />} />
          <Route path="/archive" element={<ArchiveManagement />} />
          <Route path="/audit" element={<AuditLogManagement />} />
        </Routes>
      </Paper>
    </Box>
  );
};

export default Administration;
