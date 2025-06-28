import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';

import { caseService, applicationService, originService, priorityService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import DataVisibilityInfo from '../components/Common/DataVisibilityInfo';
import { useReferentialIntegrity } from '../hooks/useReferentialIntegrity';
import { Case, Application, Origin, Priority } from '../types';

interface ClassificationCriteria {
  historialCaso: number;
  conocimientoModulo: number;
  manipulacionDatos: number;
  claridadDescripcion: number;
  causaFallo: number;
}

const CaseClassification: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [criteria, setCriteria] = useState<ClassificationCriteria>({
    historialCaso: 1,
    conocimientoModulo: 1,
    manipulacionDatos: 1,
    claridadDescripcion: 1,
    causaFallo: 1,
  });
  const [formData, setFormData] = useState({
    case_number: '',
    description: '',
    application_id: '',
    origin_id: '',
  });

  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();
  const { safeExecute } = useReferentialIntegrity();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesData, appsData, originsData, prioritiesData] = await Promise.all([
        caseService.getAll(user?.id, isAdmin),
        applicationService.getAll(),
        originService.getAll(),
        priorityService.getAll(),
      ]);

      // Los datos ya vienen transformados del servicio con los nombres
      setCases(casesData);
      setApplications(appsData);
      setOrigins(originsData);
      setPriorities(prioritiesData);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateComplexity = (score: number): 'ALTO' | 'MEDIO' | 'BAJO' => {
    if (score >= 12) return 'ALTO';
    if (score >= 7) return 'MEDIO';
    return 'BAJO';
  };

  const getClassificationText = (score: number): string => {
    if (score >= 12) return 'Alta Complejidad';
    if (score >= 7) return 'Media Complejidad';
    return 'Baja Complejidad';
  };

  const calculateScore = () => {
    return Object.values(criteria).reduce((sum, value) => sum + value, 0);
  };

  const handleOpenDialog = (caseData?: Case) => {
    if (caseData) {
      setSelectedCase(caseData);
      setFormData({
        case_number: caseData.case_number,
        description: caseData.description,
        application_id: caseData.application_id,
        origin_id: caseData.origin_id,
      });
      
      // Si el caso ya tiene clasificación, cargar los criterios
      if (caseData.classification_score) {
        const avgScore = Math.round(caseData.classification_score / 5);
        setCriteria({
          historialCaso: avgScore,
          conocimientoModulo: avgScore,
          manipulacionDatos: avgScore,
          claridadDescripcion: avgScore,
          causaFallo: avgScore,
        });
      }
    } else {
      setSelectedCase(null);
      setFormData({
        case_number: '',
        description: '',
        application_id: '',
        origin_id: '',
      });
      setCriteria({
        historialCaso: 1,
        conocimientoModulo: 1,
        manipulacionDatos: 1,
        claridadDescripcion: 1,
        causaFallo: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCase(null);
  };

  const handleSave = async () => {
    // Validaciones iniciales
    if (!user?.id) {
      toast.error('Error: Usuario no autenticado');
      return;
    }

    if (!formData.case_number?.trim()) {
      toast.error('Error: El número de caso es requerido');
      return;
    }

    if (!formData.description?.trim()) {
      toast.error('Error: La descripción es requerida');
      return;
    }

    if (!formData.application_id) {
      toast.error('Error: Debe seleccionar una aplicación');
      return;
    }

    if (!formData.origin_id) {
      toast.error('Error: Debe seleccionar un origen');
      return;
    }

    if (priorities.length === 0) {
      toast.error('Error: No hay prioridades disponibles');
      return;
    }

    const score = calculateScore();
    const complexity = calculateComplexity(score);
    const classification = getClassificationText(score);

    const caseData = {
      ...formData,
      complexity,
      classification_score: score,
      classification,
      status: 'PENDIENTE' as const,
      priority_id: priorities[0].id, // Usar la primera prioridad disponible
    };

    const result = await safeExecute(async () => {
      if (selectedCase) {
        // En actualización, no cambiar el user_id original
        await caseService.update(selectedCase.id, caseData, user.id, isAdmin);
        return 'actualizado';
      } else {
        // En creación, asegurar que el user_id se envía correctamente
        await caseService.create(caseData, user.id);
        return 'creado';
      }
    }, 'Guardar clasificación');

    if (result) {
      toast.success(`Caso ${result} y clasificado exitosamente`);
      handleCloseDialog();
      loadData();
    }
  };

  const handleDelete = async (caseId: string) => {
    showConfirmDialog(
      'Eliminar Caso',
      '¿Está seguro de que desea eliminar este caso? Esta acción no se puede deshacer.',
      async () => {
        const result = await safeExecute(async () => {
          await caseService.delete(caseId, user?.id, isAdmin);
          return true;
        }, 'Eliminar caso');

        if (result) {
          toast.success('Caso eliminado exitosamente');
          loadData();
        }
      }
    );
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialogData({
      title,
      message,
      onConfirm
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmDialogAccept = () => {
    confirmDialogData.onConfirm();
    setConfirmDialogOpen(false);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'ALTO': return 'error';
      case 'MEDIO': return 'warning';
      case 'BAJO': return 'success';
      default: return 'default';
    }
  };

  const criteriaLabels = {
    historialCaso: 'Historial del caso',
    conocimientoModulo: 'Conocimiento del módulo',
    manipulacionDatos: 'Manipulación de datos',
    claridadDescripcion: 'Claridad de la descripción',
    causaFallo: 'Causa del fallo',
  };

  const criteriaOptions = {
    historialCaso: [
      'Error conocido y solucionado previamente',
      'Error recurrente, no solucionado',
      'Error desconocido, no solucionado'
    ],
    conocimientoModulo: [
      'Conoce módulo y función puntual',
      'Conoce módulo, requiere capacitación',
      'Desconoce módulo, requiere capacitación'
    ],
    manipulacionDatos: [
      'Mínima o no necesaria',
      'Intensiva, sin replicar lógica',
      'Extremadamente compleja, replicar lógica'
    ],
    claridadDescripcion: [
      'Descripción clara y precisa',
      'Descripción ambigua o poco clara',
      'Descripción confusa o inexacta'
    ],
    causaFallo: [
      'Error operativo, fácil solución',
      'Falla puntual, requiere pruebas',
      'Falla compleja, pruebas adicionales'
    ]
  };

  const currentScore = calculateScore();

  const columns: GridColDef[] = [
    { field: 'case_number', headerName: 'Número de Caso', width: 150 },
    { field: 'description', headerName: 'Descripción', width: 250, flex: 1 },
    {
      field: 'classification',
      headerName: 'Clasificación',
      width: 150,
      renderCell: (params: any) => (
        <Chip
          label={params.value || 'Sin clasificar'}
          color={params.value ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'classification_score',
      headerName: 'Puntuación',
      width: 100,
      renderCell: (params: any) => (
        <Chip
          label={params.value || '0'}
          color="info"
          size="small"
        />
      ),
    },
    {
      field: 'complexity',
      headerName: 'Complejidad',
      width: 120,
      renderCell: (params: any) => (
        <Chip
          label={params.value}
          color={getComplexityColor(params.value) as any}
          size="small"
        />
      ),
    },
    { field: 'application_name', headerName: 'Aplicación', width: 130 },
    { field: 'origin_name', headerName: 'Origen', width: 120 },
    { field: 'priority_name', headerName: 'Prioridad', width: 120 },
    { field: 'user_name', headerName: 'Asignado a', width: 130 },
    {
      field: 'created_at',
      headerName: 'Fecha Creación',
      width: 150,
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      renderCell: (params: any) => (
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Clasificación de Casos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Caso
        </Button>
      </Box>

      <DataVisibilityInfo />

      {/* Estadísticas de clasificación */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Alta Complejidad
                  </Typography>
                  <Typography variant="h4">
                    {cases.filter(c => c.complexity === 'ALTO').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Media Complejidad
                  </Typography>
                  <Typography variant="h4">
                    {cases.filter(c => c.complexity === 'MEDIO').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Baja Complejidad
                  </Typography>
                  <Typography variant="h4">
                    {cases.filter(c => c.complexity === 'BAJO').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de casos */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={cases}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog para clasificar caso */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCase ? 'Clasificar Caso' : 'Nuevo Caso con Clasificación'}
          {!selectedCase && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Nota: Usted será asignado automáticamente como el propietario del caso
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Información del caso */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información del Caso
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Caso"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Aplicación</InputLabel>
                <Select
                  value={formData.application_id}
                  onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                >
                  {applications.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Origen</InputLabel>
                <Select
                  value={formData.origin_id}
                  onChange={(e) => setFormData({ ...formData, origin_id: e.target.value })}
                >
                  {origins.map((origin) => (
                    <MenuItem key={origin.id} value={origin.id}>
                      {origin.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Criterios de clasificación */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Criterios de Clasificación
              </Typography>
            </Grid>

            {Object.entries(criteria).map(([key, value]) => (
              <Grid item xs={12} key={key}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  {criteriaLabels[key as keyof ClassificationCriteria]}
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={value}
                    onChange={(e) => 
                      setCriteria({ ...criteria, [key]: e.target.value as number })
                    }
                  >
                    <MenuItem value={1}>
                      {criteriaOptions[key as keyof typeof criteriaOptions][0]}
                    </MenuItem>
                    <MenuItem value={2}>
                      {criteriaOptions[key as keyof typeof criteriaOptions][1]}
                    </MenuItem>
                    <MenuItem value={3}>
                      {criteriaOptions[key as keyof typeof criteriaOptions][2]}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            ))}

            {/* Resultado de la clasificación */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.50', mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resultado de la Clasificación
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1">
                      Puntuación Total: <strong>{currentScore}</strong>
                    </Typography>
                    <Chip
                      label={getClassificationText(currentScore)}
                      color={getComplexityColor(calculateComplexity(currentScore)) as any}
                    />
                    <Chip
                      label={calculateComplexity(currentScore)}
                      color={getComplexityColor(calculateComplexity(currentScore)) as any}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedCase ? 'Actualizar Clasificación' : 'Crear y Clasificar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={handleConfirmDialogClose}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          {confirmDialogData.title}
        </DialogTitle>
        <DialogContent>
          <Typography>{confirmDialogData.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleConfirmDialogClose} 
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDialogAccept} 
            variant="contained" 
            color="error"
            startIcon={<CheckIcon />}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseClassification;
