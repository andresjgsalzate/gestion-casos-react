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
  Policy as PolicyIcon
} from '@mui/icons-material';

import { ArchiveService } from '../../services/archiveService';
import type { ArchivePolicy } from '../../types';

const ArchiveManagement: React.FC = () => {
  const [policies, setPolicies] = useState<ArchivePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    conditions: {},
    // Nuevos campos de configuración general
    warning_days_before_expiry: 30,
    allow_user_archive: true,
    allow_user_restore: true,
    require_reason_for_archive: false,
    require_reason_for_restore: false,
    enable_notifications: true,
    enable_legal_hold: false,
    max_retention_days: 7300,
    bulk_operation_limit: 1000
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar políticas
      const policiesResult = await ArchiveService.getArchivePolicies();
      if (policiesResult.success) {
        setPolicies(policiesResult.data || []);
        if (policiesResult.error) {
          // Mostrar advertencia si el módulo no está instalado
          setError(policiesResult.error);
        }
      } else {
        console.warn('Error cargando políticas:', policiesResult.error);
        setPolicies([]);
        setError(policiesResult.error || 'Error al cargar las políticas de archivo');
      }

    } catch (err: any) {
      console.error('Error loading archive configuration:', err);
      setError(err?.message || 'Error al cargar la configuración del archivo');
    } finally {
      setLoading(false);
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
        conditions: policy.conditions || {},
        // Nuevos campos de configuración general
        warning_days_before_expiry: policy.warning_days_before_expiry || 30,
        allow_user_archive: policy.allow_user_archive ?? true,
        allow_user_restore: policy.allow_user_restore ?? true,
        require_reason_for_archive: policy.require_reason_for_archive || false,
        require_reason_for_restore: policy.require_reason_for_restore || false,
        enable_notifications: policy.enable_notifications ?? true,
        enable_legal_hold: policy.enable_legal_hold || false,
        max_retention_days: policy.max_retention_days || 7300,
        bulk_operation_limit: policy.bulk_operation_limit || 1000
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
        conditions: {},
        // Nuevos campos de configuración general
        warning_days_before_expiry: 30,
        allow_user_archive: true,
        allow_user_restore: true,
        require_reason_for_archive: false,
        require_reason_for_restore: false,
        enable_notifications: true,
        enable_legal_hold: false,
        max_retention_days: 7300,
        bulk_operation_limit: 1000
      });
    }
    setOpenPolicyDialog(true);
  };

  const handleSavePolicy = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Validaciones básicas
      if (!policyForm.name.trim()) {
        setError('El nombre de la política es requerido');
        return;
      }
      
      if (policyForm.days_after_completion < 1) {
        setError('Los días después de completado debe ser mayor a 0');
        return;
      }
      
      if (policyForm.inactivity_days < 1) {
        setError('Los días de inactividad debe ser mayor a 0');
        return;
      }
      
      if (policyForm.default_retention_days < 1) {
        setError('Los días de retención debe ser mayor a 0');
        return;
      }

      // Limpiar y preparar datos - eliminar campos undefined/null
      const cleanPolicyData = {
        name: policyForm.name.trim(),
        description: policyForm.description?.trim() || '',
        is_active: Boolean(policyForm.is_active),
        auto_archive_enabled: Boolean(policyForm.auto_archive_enabled),
        days_after_completion: Number(policyForm.days_after_completion),
        inactivity_days: Number(policyForm.inactivity_days),
        default_retention_days: Number(policyForm.default_retention_days),
        apply_to_cases: Boolean(policyForm.apply_to_cases),
        apply_to_todos: Boolean(policyForm.apply_to_todos),
        conditions: policyForm.conditions || {},
        // Nuevos campos de configuración general
        warning_days_before_expiry: Number(policyForm.warning_days_before_expiry),
        allow_user_archive: Boolean(policyForm.allow_user_archive),
        allow_user_restore: Boolean(policyForm.allow_user_restore),
        require_reason_for_archive: Boolean(policyForm.require_reason_for_archive),
        require_reason_for_restore: Boolean(policyForm.require_reason_for_restore),
        enable_notifications: Boolean(policyForm.enable_notifications),
        enable_legal_hold: Boolean(policyForm.enable_legal_hold),
        max_retention_days: Number(policyForm.max_retention_days),
        bulk_operation_limit: Number(policyForm.bulk_operation_limit)
      };

      console.log('=== DATOS DESDE COMPONENTE ===');
      console.log('Editing policy:', !!editingPolicy);
      console.log('Policy ID:', editingPolicy?.id);
      console.log('Original form data:', policyForm);
      console.log('Clean policy data:', cleanPolicyData);
      
      let result;
      if (editingPolicy) {
        console.log('Actualizando política existente con ID:', editingPolicy.id);
        result = await ArchiveService.updateArchivePolicy(editingPolicy.id, cleanPolicyData);
      } else {
        console.log('Creando nueva política');
        result = await ArchiveService.createArchivePolicy(cleanPolicyData);
      }

      console.log('Resultado de la operación:', result);

      if (result.success) {
        setOpenPolicyDialog(false);
        setSuccessMessage(
          editingPolicy 
            ? 'Política actualizada exitosamente' 
            : 'Política creada exitosamente'
        );
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData(); // Recargar datos
      } else {
        console.error('Error en la operación:', result.error);
        setError(result.error || 'Error al guardar política');
      }
    } catch (err: any) {
      console.error('Error saving policy:', err);
      setError(err?.message || 'Error al guardar la política');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta política?')) return;

    try {
      setError(null);
      setSuccessMessage(null);
      
      const result = await ArchiveService.deleteArchivePolicy(policyId);
      if (result.success) {
        setSuccessMessage('Política eliminada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData(); // Recargar datos
      } else {
        setError(result.error || 'Error al eliminar política');
      }
    } catch (err: any) {
      console.error('Error deleting policy:', err);
      setError(err?.message || 'Error al eliminar la política');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Cargando configuración...</Typography>
      </Box>
    );
  }

  // Si hay error relacionado con módulo no instalado, mostrar mensaje específico
  const isModuleNotInstalled = error && error.includes('módulo de archivo no está instalado');

  if (isModuleNotInstalled) {
    return (
      <Box>
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.open('/database/archive_module.sql', '_blank')}
            >
              Ver Script SQL
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Módulo de Archivo No Instalado
          </Typography>
          <Typography variant="body2" gutterBottom>
            El módulo de archivo no está instalado en la base de datos. Para habilitar esta funcionalidad:
          </Typography>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            1. Ejecute el script <code>database/archive_module.sql</code> en su base de datos
            <br />
            2. Verifique que tenga los permisos necesarios
            <br />
            3. Recargue esta página
          </Typography>
        </Alert>
        
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ArchiveIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Gestión de Archivo
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Esta sección permite configurar políticas de archivo automático y manual para casos y tareas.
              Una vez instalado el módulo, podrá:
            </Typography>
            <Box component="ul" sx={{ mt: 2, pl: 2 }}>
              <li>Configurar archivo automático por tiempo de inactividad</li>
              <li>Definir políticas de retención de datos</li>
              <li>Gestionar archivo manual de casos y tareas</li>
              <li>Configurar notificaciones de archivo</li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {error && !isModuleNotInstalled && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ArchiveIcon />
        Gestión de Políticas de Archivo
      </Typography>

      <Grid container spacing={3}>
        {/* Políticas de Archivo */}
        <Grid item xs={12}>
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

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Las políticas de archivo permiten configurar todas las opciones del módulo de archivo, 
                incluyendo configuración general, reglas de archivo automático y permisos de usuario.
              </Typography>

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

            {/* Configuración General del Módulo */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                Configuración General del Módulo
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Días de advertencia antes de expirar"
                value={policyForm.warning_days_before_expiry}
                onChange={(e) => setPolicyForm({ 
                  ...policyForm, 
                  warning_days_before_expiry: parseInt(e.target.value) || 30 
                })}
                helperText="Días antes del vencimiento para enviar alertas"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Máximo días de retención"
                value={policyForm.max_retention_days}
                onChange={(e) => setPolicyForm({ 
                  ...policyForm, 
                  max_retention_days: parseInt(e.target.value) || 7300 
                })}
                helperText="Máximo de días permitidos para retener elementos"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Límite operaciones masivas"
                value={policyForm.bulk_operation_limit}
                onChange={(e) => setPolicyForm({ 
                  ...policyForm, 
                  bulk_operation_limit: parseInt(e.target.value) || 1000 
                })}
                helperText="Máximo elementos en operaciones masivas"
              />
            </Grid>

            {/* Permisos de Usuario */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                Permisos de Usuario
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.allow_user_archive}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      allow_user_archive: e.target.checked 
                    })}
                  />
                }
                label="Permitir archivo por usuario"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.allow_user_restore}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      allow_user_restore: e.target.checked 
                    })}
                  />
                }
                label="Permitir restauración por usuario"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.require_reason_for_archive}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      require_reason_for_archive: e.target.checked 
                    })}
                  />
                }
                label="Requerir razón para archivar"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.require_reason_for_restore}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      require_reason_for_restore: e.target.checked 
                    })}
                  />
                }
                label="Requerir razón para restaurar"
              />
            </Grid>

            {/* Notificaciones y Funcionalidades */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                Notificaciones y Funcionalidades
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.enable_notifications}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      enable_notifications: e.target.checked 
                    })}
                  />
                }
                label="Habilitar notificaciones"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.enable_legal_hold}
                    onChange={(e) => setPolicyForm({ 
                      ...policyForm, 
                      enable_legal_hold: e.target.checked 
                    })}
                  />
                }
                label="Habilitar retención legal"
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
