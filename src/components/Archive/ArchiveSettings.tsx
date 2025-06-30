import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface ArchiveSettingsProps {
  open: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

/**
 * Componente deprecado - La configuración del archivo ahora se maneja
 * completamente a través de las Políticas de Archivo en el panel de administración
 */
const ArchiveSettings: React.FC<ArchiveSettingsProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Configuración del Módulo de Archivo
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          La configuración del módulo de archivo ahora se maneja completamente 
          a través de las <strong>Políticas de Archivo</strong> en el panel de administración.
        </Alert>
        
        <Typography variant="body2" color="text.secondary">
          Para configurar el módulo de archivo:
        </Typography>
        
        <Typography component="ol" sx={{ mt: 1, pl: 2 }}>
          <li>Ve a <strong>Administración → Gestión de Archivo</strong></li>
          <li>Crea o edita una política de archivo</li>
          <li>Configura todas las opciones del módulo en el formulario de políticas</li>
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Las políticas de archivo incluyen ahora toda la configuración general del módulo, 
          permisos de usuario, notificaciones y reglas de archivo automático.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveSettings;