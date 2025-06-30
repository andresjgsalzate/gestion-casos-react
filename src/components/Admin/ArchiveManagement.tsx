import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Archive as ArchiveIcon,
  Schedule as ScheduleIcon,
  Policy as PolicyIcon
} from '@mui/icons-material';

import { ArchiveService } from '../../services/archiveService';
import type { ArchivePolicy, ArchiveSettings } from '../../types';

const ArchiveManagement: React.FC = () => {
  const [settings, setSettings] = useState<ArchiveSettings | null>(null);
  const [policies, setPolicies] = useState<ArchivePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPolicyDialog, setOpenPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ArchivePolicy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    is_active: true,
    auto_archive_enabled: false,
    days_after_completion: 30,
    inactivity_days: 90,
    default_retention_days: 2555,
    apply_to_cases: true,
    apply_to_todos: true,
    conditions: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar configuraciones
      const settingsResult = await ArchiveService.getArchiveSettings();
      if (settingsResult.success) {
        setSettings(settingsResult.data || null);
      }

      // Cargar políticas
      const policiesResult = await ArchiveService.getArchivePolicies();
      if (policiesResult.success) {
        setPolicies(policiesResult.data || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading archive configuration:', err);
      setError('Error al cargar la configuración del archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      const result = await ArchiveService.updateArchiveSettings(settings);
      if (result.success) {
        setError(null);
        // Mostrar mensaje de éxito
      } else {
        setError(result.error || 'Error al guardar configuración');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración');
    }
  };

  const handleOpenPolicyDialog = (policy?: ArchivePolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyForm({
        name: policy.name,
        description: policy.description || '',
        is_active: policy.is_active,
        auto_archive_enabled: policy.auto_archive_enabled,
        days_after_completion: policy.days_after_completion || 30,
        inactivity_days: policy.inactivity_days || 90,
        default_retention_days: policy.default_retention_days,
        apply_to_cases: policy.apply_to_cases,
        apply_to_todos: policy.apply_to_todos,
        conditions: policy.conditions || {}
      });
    } else {
      setEditingPolicy(null);
      setPolicyForm({
        name: '',
        description: '',
        is_active: true,
        auto_archive_enabled: false,
        days_after_completion: 30,
        inactivity_days: 90,
        default_retention_days: 2555,
        apply_to_cases: true,
        apply_to_todos: true,
        conditions: {}
      });
    }
    setOpenPolicyDialog(true);
  };

  const handleSavePolicy = async () => {
    try {
      let result;
      if (editingPolicy) {
        result = await ArchiveService.updateArchivePolicy(editingPolicy.id, policyForm);
      } else {
        result = await ArchiveService.createArchivePolicy(policyForm);
      }

      if (result.success) {
        setOpenPolicyDialog(false);
        loadData(); // Recargar datos
      } else {
        setError(result.error || 'Error al guardar política');
      }
    } catch (err) {
      console.error('Error saving policy:', err);
      setError('Error al guardar la política');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta política?')) return;

    try {
      const result = await ArchiveService.deleteArchivePolicy(policyId);
      if (result.success) {
        loadData(); // Recargar datos
      } else {
        setError(result.error || 'Error al eliminar política');
      }
    } catch (err) {
      console.error('Error deleting policy:', err);
      setError('Error al eliminar la política');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Cargando configuración...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ArchiveIcon />
        Configuración del Módulo de Archivo
      </Typography>

      <Grid container spacing={3}>
        {/* Configuración General */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                Configuración General
              </Typography>
              
              {settings && (
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoArchiveEnabled || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoArchiveEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Archivo Automático Habilitado"
                  />

                  <TextField
                    fullWidth
                    label="Días de Retención por Defecto"
                    type="number"
                    value={settings.defaultRetentionDays || 2555}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultRetentionDays: parseInt(e.target.value) || 2555
                    })}
                    sx={{ mt: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Días de Advertencia Antes del Vencimiento"
                    type="number"
                    value={settings.warningDaysBeforeExpiry || 30}
                    onChange={(e) => setSettings({
                      ...settings,
                      warningDaysBeforeExpiry: parseInt(e.target.value) || 30
                    })}
                    sx={{ mt: 2 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          enableNotifications: e.target.checked
                        })}
                      />
                    }
                    label="Notificaciones Habilitadas"
                    sx={{ mt: 2, display: 'block' }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowUserArchive || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          allowUserArchive: e.target.checked
                        })}
                      />
                    }
                    label="Permitir Archivo por Usuario"
                    sx={{ mt: 1, display: 'block' }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowUserRestore || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          allowUserRestore: e.target.checked
                        })}
                      />
                    }
                    label="Permitir Restauración por Usuario"
                    sx={{ mt: 1, display: 'block' }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                    sx={{ mt: 3 }}
                  >
                    Guardar Configuración
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Políticas de Archivo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PolicyIcon />
                  Políticas de Archivo
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenPolicyDialog()}
                  size="small"
                >
                  Nueva Política
                </Button>
              </Box>

              <List>
                {policies.map((policy) => (
                  <ListItem key={policy.id} divider>
                    <ListItemText
                      primary={policy.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {policy.description}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={policy.is_active ? 'Activa' : 'Inactiva'}
                              color={policy.is_active ? 'success' : 'default'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {policy.auto_archive_enabled && (
                              <Chip label="Auto-archivo" color="info" size="small" sx={{ mr: 1 }} />
                            )}
                            {policy.apply_to_cases && (
                              <Chip label="Casos" color="primary" size="small" sx={{ mr: 1 }} />
                            )}
                            {policy.apply_to_todos && (
                              <Chip label="TODOs" color="secondary" size="small" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Editar">
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenPolicyDialog(policy)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          edge="end"
                          onClick={() => handleDeletePolicy(policy.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {policies.length === 0 && (
                <Alert severity="info">
                  No hay políticas de archivo configuradas.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para crear/editar política */}
      <Dialog open={openPolicyDialog} onClose={() => setOpenPolicyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPolicy ? 'Editar Política' : 'Nueva Política de Archivo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Política"
                value={policyForm.name}
                onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción"
                value={policyForm.description}
                onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Días después de completado"
                value={policyForm.days_after_completion}
                onChange={(e) => setPolicyForm({ 
                  ...policyForm, 
                  days_after_completion: parseInt(e.target.value) || 30 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Días de inactividad"
                value={policyForm.inactivity_days}
                onChange={(e) => setPolicyForm({ 
                  ...policyForm, 
                  inactivity_days: parseInt(e.target.value) || 90 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Días de retención por defecto"
                value={policyForm.default_retention_days}
                onChange={(e) => setPolicyForm({ 
                  ...policyForm, 
                  default_retention_days: parseInt(e.target.value) || 2555 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.is_active}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      is_active: e.target.checked 
                    })}
                  />
                }
                label="Política activa"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.auto_archive_enabled}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      auto_archive_enabled: e.target.checked 
                    })}
                  />
                }
                label="Habilitar archivo automático"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.apply_to_cases}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      apply_to_cases: e.target.checked 
                    })}
                  />
                }
                label="Aplicar a casos"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.apply_to_todos}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      apply_to_todos: e.target.checked 
                    })}
                  />
                }
                label="Aplicar a TODOs"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPolicyDialog(false)} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button onClick={handleSavePolicy} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArchiveManagement;
