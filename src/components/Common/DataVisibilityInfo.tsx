import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';

const DataVisibilityInfo: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <Box sx={{ mb: 2 }}>
      {isAdmin ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Modo Administrador:</strong> Estás viendo todos los casos y tareas del sistema. 
            Como administrador, puedes ver y gestionar los datos de todos los usuarios.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Vista Personal:</strong> Estás viendo solo tus casos y tareas asignadas. 
            Los datos de otros usuarios están protegidos y no son visibles para ti.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default DataVisibilityInfo;
