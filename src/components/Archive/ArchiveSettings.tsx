import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Box,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { ArchiveSettings, ArchivePolicy } from '../../types';

interface ArchiveSettingsProps {
  open: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

const defaultSettings: ArchiveSettings = {
  autoArchiveEnabled: false,
  defaultRetentionDays: 2555, // 7 años
  warningDaysBeforeExpiry: 30,
  allowUserArchive: true,
  allowUserRestore: true,
  requireReasonForArchive: true,
  requireReasonForRestore: true,
  enableNotifications: true,
  enableLegalHold: false,
  maxRetentionDays: 3650, // 10 años
  bulkOperationLimit: 100,
};

const ArchiveSettingsComponent: React.FC<ArchiveSettingsProps> = ({
  open,
  onClose,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<ArchiveSettings>(defaultSettings);
  const [policies, setPolicies] = useState<ArchivePolicy[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
      loadPolicies();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      // En una implementación real, cargaríamos la configuración desde el backend
      // const settingsData = await archiveService.getArchiveSettings();
      // setSettings(settingsData);
      
      // Por ahora usamos valores por defecto
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      setError('Error al cargar la configuración');
    }
  };

  const loadPolicies = async () => {
    try {
      // En una implementación real, cargaríamos las políticas desde el backend
      // const policiesData = await archiveService.getArchivePolicies();
      // setPolicies(policiesData);
      
      // Por ahora usamos datos de ejemplo
      setPolicies([
        {
          id: '1',
          name: 'Casos Completados',
          description: 'Archivar casos completados después de 90 días',
          is_active: true,
          auto_archive_enabled: true,
          days_after_completion: 90,
          default_retention_days: 2555,
          apply_to_cases: true,
          apply_to_todos: false,
          conditions: {},
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'TODOs Inactivos',
          description: 'Archivar TODOs sin actividad por 30 días',
          is_active: false,
          auto_archive_enabled: true,
          inactivity_days: 30,
          default_retention_days: 365,
          apply_to_cases: false,
          apply_to_todos: true,
          conditions: {},
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error al cargar políticas:', error);
    }
  };

  const handleSettingChange = (key: keyof ArchiveSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validaciones
      if (settings.defaultRetentionDays < 1 || settings.defaultRetentionDays > settings.maxRetentionDays) {
        setError('Los días de retención por defecto deben estar entre 1 y el máximo permitido');
        return;
      }
      
      if (settings.warningDaysBeforeExpiry < 1 || settings.warningDaysBeforeExpiry > 365) {
        setError('Los días de advertencia deben estar entre 1 y 365');
        return;
      }

      // En una implementación real, guardaríamos la configuración en el backend
      // await archiveService.updateArchiveSettings(settings);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSettingsUpdated?.();
      
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
  };

  const handleTogglePolicy = async (policyId: string, isActive: boolean) => {
    try {
      // En una implementación real, actualizaríamos la política en el backend
      // await archiveService.updateArchivePolicy(policyId, { is_active: isActive });
      
      setPolicies(prev => prev.map(policy => 
        policy.id === policyId ? { ...policy, is_active: isActive } : policy
      ));
    } catch (error) {
      console.error('Error al actualizar política:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <SettingsIcon sx={{ mr: 1 }} />
          Configuración del Archivo
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuración guardada exitosamente
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Configuración General */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Configuración General
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Retención por defecto (días)"
                      type="number"
                      value={settings.defaultRetentionDays}
                      onChange={(e) => handleSettingChange('defaultRetentionDays', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: settings.maxRetentionDays }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Máxima retención (días)"
                      type="number"
                      value={settings.maxRetentionDays}
                      onChange={(e) => handleSettingChange('maxRetentionDays', parseInt(e.target.value))}
                      inputProps={{ min: settings.defaultRetentionDays }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Advertencia antes de expirar (días)"
                      type="number"
                      value={settings.warningDaysBeforeExpiry}
                      onChange={(e) => handleSettingChange('warningDaysBeforeExpiry', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 365 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Límite de operaciones masivas"
                      type="number"
                      value={settings.bulkOperationLimit}
                      onChange={(e) => handleSettingChange('bulkOperationLimit', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 1000 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuración de Automatización */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Automatización
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoArchiveEnabled}
                          onChange={(e) => handleSettingChange('autoArchiveEnabled', e.target.checked)}
                        />
                      }
                      label="Habilitar archivo automático"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableNotifications}
                          onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                        />
                      }
                      label="Habilitar notificaciones"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuración de Permisos */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Permisos y Seguridad
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowUserArchive}
                          onChange={(e) => handleSettingChange('allowUserArchive', e.target.checked)}
                        />
                      }
                      label="Permitir archivo por usuarios"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowUserRestore}
                          onChange={(e) => handleSettingChange('allowUserRestore', e.target.checked)}
                        />
                      }
                      label="Permitir restauración por usuarios"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.requireReasonForArchive}
                          onChange={(e) => handleSettingChange('requireReasonForArchive', e.target.checked)}
                        />
                      }
                      label="Requerir razón para archivar"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.requireReasonForRestore}
                          onChange={(e) => handleSettingChange('requireReasonForRestore', e.target.checked)}
                        />
                      }
                      label="Requerir razón para restaurar"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableLegalHold}
                          onChange={(e) => handleSettingChange('enableLegalHold', e.target.checked)}
                        />
                      }
                      label="Habilitar retención legal"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Políticas de Archivo */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Políticas de Archivo
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Nueva Política
                  </Button>
                </Box>
                
                <List>
                  {policies.map((policy, index) => (
                    <React.Fragment key={policy.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {policy.name}
                              <Chip
                                size="small"
                                label={policy.is_active ? 'Activa' : 'Inactiva'}
                                color={policy.is_active ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={policy.description}
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" gap={1}>
                            <Switch
                              checked={policy.is_active}
                              onChange={(e) => handleTogglePolicy(policy.id, e.target.checked)}
                              size="small"
                            />
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < policies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleResetSettings}
          startIcon={<RestoreIcon />}
          disabled={saving}
        >
          Restaurar Defecto
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSaveSettings}
          startIcon={<SaveIcon />}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveSettingsComponent;
