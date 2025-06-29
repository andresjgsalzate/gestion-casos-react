import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  Schedule as ScheduleIcon,
  GetApp as ExportIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

import { 
  caseService, 
  applicationService, 
  originService, 
  priorityService,
  timeService 
} from '../services/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Case, Application, Origin, Priority, CaseFormData, TimeEntry } from '../types';

const CaseManagement: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [manualTimeDialogOpen, setManualTimeDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedCaseForTime, setSelectedCaseForTime] = useState<Case | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [timer, setTimer] = useState({ 
    running: false, 
    seconds: 0, 
    caseId: null as string | null, 
    timeEntryId: null as string | null 
  });
  const [manualTimeForm, setManualTimeForm] = useState({
    hours: 0,
    minutes: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState<CaseFormData>({
    case_number: '',
    description: '',
    complexity: 'MEDIO',
    status: 'PENDIENTE',
    application_id: '',
    origin_id: '',
    priority_id: '',
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

  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.running) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.running]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [casesData, appsData, originsData, prioritiesData] = await Promise.all([
        caseService.getAll(),
        applicationService.getAll(),
        originService.getAll(),
        priorityService.getAll(),
      ]);

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
  };

  const handleOpenDialog = (caseData?: Case) => {
    if (caseData) {
      setSelectedCase(caseData);
      setFormData({
        case_number: caseData.case_number,
        description: caseData.description,
        complexity: caseData.complexity,
        status: caseData.status,
        application_id: caseData.application_id,
        origin_id: caseData.origin_id,
        priority_id: caseData.priority_id,
      });
    } else {
      setSelectedCase(null);
      setFormData({
        case_number: '',
        description: '',
        complexity: 'MEDIO',
        status: 'PENDIENTE',
        application_id: '',
        origin_id: '',
        priority_id: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCase(null);
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      if (selectedCase) {
        await caseService.update(selectedCase.id, formData);
        toast.success('Caso actualizado exitosamente');
      } else {
        await caseService.create(formData, user.id);
        toast.success('Caso creado exitosamente');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      toast.error('Error al guardar el caso');
      console.error(error);
    }
  };

  const handleDelete = async (caseId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: '¿Está seguro de eliminar este caso? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await caseService.delete(caseId);
          toast.success('Caso eliminado exitosamente');
          loadData();
        } catch (error) {
          toast.error('Error al eliminar el caso');
          console.error(error);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleStartTimer = async (caseId: string) => {
    try {
      if (!user) return;
      
      const timeEntry = await timeService.startTimer(caseId, undefined, user.id);
      setTimer({ running: true, seconds: 0, caseId, timeEntryId: timeEntry.id });
      toast.success('Timer iniciado');
    } catch (error) {
      toast.error('Error al iniciar el timer');
      console.error(error);
    }
  };

  const handleStopTimer = async () => {
    try {
      if (timer.caseId && timer.timeEntryId) {
        const endTime = new Date().toISOString();
        
        const { error } = await supabase
          .from('time_entries')
          .update({
            end_time: endTime,
            duration_seconds: timer.seconds
          })
          .eq('id', timer.timeEntryId);

        if (error) throw error;

        await caseService.updateStatus(timer.caseId, 'EN CURSO');
        setTimer({ running: false, seconds: 0, caseId: null, timeEntryId: null });
        toast.success('Timer detenido y caso actualizado');
        loadData();
      }
    } catch (error) {
      toast.error('Error al detener el timer');
      console.error(error);
    }
  };

  const handleOpenTimeDialog = async (caseData: Case) => {
    setSelectedCaseForTime(caseData);
    try {
      const entries = await timeService.getTimeEntriesByCase(caseData.id);
      setTimeEntries(entries);
      setTimeDialogOpen(true);
    } catch (error) {
      toast.error('Error al cargar los tiempos');
      console.error(error);
    }
  };

  const handleOpenManualTimeDialog = (caseData: Case) => {
    setSelectedCaseForTime(caseData);
    setManualTimeForm({
      hours: 0,
      minutes: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setManualTimeDialogOpen(true);
  };

  const handleSaveManualTime = async () => {
    try {
      if (!user || !selectedCaseForTime) return;

      const totalSeconds = (manualTimeForm.hours * 3600) + (manualTimeForm.minutes * 60);
      const startTime = new Date(manualTimeForm.date).toISOString();
      const endTime = new Date(new Date(manualTimeForm.date).getTime() + (totalSeconds * 1000)).toISOString();

      const { error } = await supabase
        .from('time_entries')
        .insert({
          case_id: selectedCaseForTime.id,
          user_id: user.id,
          start_time: startTime,
          end_time: endTime,
          duration_seconds: totalSeconds,
          description: manualTimeForm.description || 'Tiempo agregado manualmente'
        });

      if (error) throw error;

      toast.success('Tiempo manual agregado exitosamente');
      setManualTimeDialogOpen(false);
      if (timeDialogOpen) {
        handleOpenTimeDialog(selectedCaseForTime);
      }
    } catch (error) {
      toast.error('Error al agregar tiempo manual');
      console.error(error);
    }
  };

  const handleDeleteTimeEntry = async (timeEntryId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: '¿Está seguro de eliminar este registro de tiempo? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('time_entries')
            .delete()
            .eq('id', timeEntryId);

          if (error) throw error;

          toast.success('Registro de tiempo eliminado exitosamente');
          if (selectedCaseForTime) {
            handleOpenTimeDialog(selectedCaseForTime);
          }
        } catch (error) {
          toast.error('Error al eliminar el registro de tiempo');
          console.error(error);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const exportToExcel = async () => {
    try {
      const exportData = await Promise.all(cases.map(async (caso) => {
        const timeEntries = await timeService.getTimeEntriesByCase(caso.id);
        const totalSeconds = timeEntries.reduce((total, entry) => {
          return total + (entry.duration_seconds || 0);
        }, 0);
        const totalHours = (totalSeconds / 3600).toFixed(2);

        const application = applications.find(app => app.id === caso.application_id);
        const origin = origins.find(org => org.id === caso.origin_id);
        const priority = priorities.find(pri => pri.id === caso.priority_id);

        return {
          'Número de Caso': caso.case_number,
          'Descripción': caso.description,
          'Estado': caso.status,
          'Complejidad': caso.complexity,
          'Aplicación': application?.name || 'N/A',
          'Origen': origin?.name || 'N/A',
          'Prioridad': priority?.name || 'N/A',
          'Asignado a': (caso as any).user_name || 'N/A',
          'Fecha Creación': new Date(caso.created_at).toLocaleDateString(),
          'Tiempo Total (horas)': totalHours,
          'Cantidad de Registros': timeEntries.length
        };
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Casos');
      XLSX.writeFile(workbook, `casos_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Archivo Excel exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar datos');
      console.error(error);
    }
  };

  const exportToExcelByMonth = async () => {
    try {
      const startDate = new Date(exportMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      const casesInMonth = cases.filter(caso => {
        const caseDate = new Date(caso.created_at);
        return caseDate >= startDate && caseDate <= endDate;
      });

      if (casesInMonth.length === 0) {
        toast.warning('No hay casos en el mes seleccionado');
        return;
      }

      const exportData = await Promise.all(casesInMonth.map(async (caso) => {
        const timeEntries = await timeService.getTimeEntriesByCase(caso.id);
        const timeEntriesInMonth = timeEntries.filter(entry => {
          const entryDate = new Date(entry.start_time);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        const totalSeconds = timeEntriesInMonth.reduce((total, entry) => {
          return total + (entry.duration_seconds || 0);
        }, 0);
        const totalHours = (totalSeconds / 3600).toFixed(2);

        const application = applications.find(app => app.id === caso.application_id);
        const origin = origins.find(org => org.id === caso.origin_id);
        const priority = priorities.find(pri => pri.id === caso.priority_id);

        return {
          'Número de Caso': caso.case_number,
          'Descripción': caso.description,
          'Estado': caso.status,
          'Complejidad': caso.complexity,
          'Aplicación': application?.name || 'N/A',
          'Origen': origin?.name || 'N/A',
          'Prioridad': priority?.name || 'N/A',
          'Asignado a': (caso as any).user_name || 'N/A',
          'Fecha Creación': new Date(caso.created_at).toLocaleDateString(),
          'Tiempo Total (horas)': totalHours,
          'Registros de Tiempo': timeEntriesInMonth.length
        };
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Casos');
      
      const monthName = new Date(exportMonth + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      XLSX.writeFile(workbook, `casos_${monthName.replace(' ', '_')}.xlsx`);
      
      toast.success('Archivo Excel exportado exitosamente');
      setExportDialogOpen(false);
    } catch (error) {
      toast.error('Error al exportar datos');
      console.error(error);
    }
  };

  const exportCaseTimesToExcel = async (caseData: Case) => {
    try {
      const timeEntries = await timeService.getTimeEntriesByCase(caseData.id);
      
      if (timeEntries.length === 0) {
        toast.warning('No hay tiempos registrados para este caso');
        return;
      }

      const timeData = timeEntries.map(entry => ({
        'Número de Caso': caseData.case_number,
        'Descripción del Caso': caseData.description,
        'Fecha': new Date(entry.start_time).toLocaleDateString(),
        'Hora Inicio': new Date(entry.start_time).toLocaleTimeString(),
        'Hora Fin': entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : 'En curso',
        'Duración (horas)': entry.duration_seconds ? (entry.duration_seconds / 3600).toFixed(2) : '0',
        'Descripción del Trabajo': entry.description || 'Sin descripción',
        'Usuario': (entry as any).users?.name || 'Usuario'
      }));

      const totalSeconds = timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
      const totalHours = (totalSeconds / 3600).toFixed(2);
      
      timeData.push({
        'Número de Caso': '',
        'Descripción del Caso': '',
        'Fecha': 'TOTAL',
        'Hora Inicio': '',
        'Hora Fin': '',
        'Duración (horas)': totalHours,
        'Descripción del Trabajo': `${timeEntries.length} registros`,
        'Usuario': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(timeData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tiempos');
      XLSX.writeFile(workbook, `tiempos_${caseData.case_number}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Tiempos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar tiempos');
      console.error(error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN CURSO': return 'primary';
      case 'TERMINADA': return 'success';
      case 'ESCALADA': return 'error';
      case 'PENDIENTE': return 'warning';
      default: return 'default';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'ALTO': return 'error';
      case 'MEDIO': return 'warning';
      case 'BAJO': return 'success';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'case_number', headerName: 'Número de Caso', width: 150 },
    { field: 'description', headerName: 'Descripción', width: 250, flex: 1 },
    {
      field: 'status',
      headerName: 'Estado',
      width: 120,
      renderCell: (params: any) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
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
    { field: 'user_name', headerName: 'Asignado a', width: 150 },
    {
      field: 'created_at',
      headerName: 'Fecha Creación',
      width: 150,
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 280,
      renderCell: (params: any) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleStartTimer(params.row.id)}
            disabled={timer.running}
            title="Iniciar Timer"
          >
            <PlayIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenTimeDialog(params.row)}
            title="Ver Tiempos"
          >
            <HistoryIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenManualTimeDialog(params.row)}
            title="Agregar Tiempo Manual"
          >
            <ScheduleIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => exportCaseTimesToExcel(params.row)}
            title="Exportar Tiempos"
          >
            <ExportIcon />
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

  const totalTimeEntries = timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Control de Casos</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Exportar por Mes
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={exportToExcel}
            sx={{ mr: 2 }}
          >
            Exportar Todo
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Caso
          </Button>
        </Box>
      </Box>

      {/* Timer */}
      {timer.running && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <TimerIcon sx={{ mr: 2 }} />
                <Typography variant="h4" color="white">
                  {formatTime(timer.seconds)}
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PauseIcon />}
                  onClick={() => setTimer(prev => ({ ...prev, running: !prev.running }))}
                  sx={{ mr: 1 }}
                >
                  {timer.running ? 'Pausar' : 'Continuar'}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStopTimer}
                >
                  Detener
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

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

      {/* Dialog para crear/editar caso */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCase ? 'Editar Caso' : 'Nuevo Caso'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Caso"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="EN CURSO">En Curso</MenuItem>
                  <MenuItem value="TERMINADA">Terminada</MenuItem>
                  <MenuItem value="ESCALADA">Escalada</MenuItem>
                </Select>
              </FormControl>
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
                <InputLabel>Complejidad</InputLabel>
                <Select
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: e.target.value as any })}
                >
                  <MenuItem value="BAJO">Bajo</MenuItem>
                  <MenuItem value="MEDIO">Medio</MenuItem>
                  <MenuItem value="ALTO">Alto</MenuItem>
                </Select>
              </FormControl>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority_id}
                  onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.id} value={priority.id}>
                      {priority.name}
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
            {selectedCase ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver tiempos del caso */}
      <Dialog open={timeDialogOpen} onClose={() => setTimeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Tiempos Registrados - {selectedCaseForTime?.case_number}
          {timeEntries.length > 0 && (
            <Chip 
              label={`Total: ${formatDuration(totalTimeEntries)}`} 
              color="primary" 
              sx={{ ml: 2 }} 
            />
          )}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell>Duración</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.start_time).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(entry.start_time).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : 'En curso'}
                    </TableCell>
                    <TableCell>
                      {entry.duration_seconds ? formatDuration(entry.duration_seconds) : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.description || '-'}
                    </TableCell>
                    <TableCell>
                      {(entry as any).users?.name || 'Usuario'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteTimeEntry(entry.id)}
                        color="error"
                        title="Eliminar registro"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {timeEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay tiempos registrados para este caso
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeDialogOpen(false)}>Cerrar</Button>
          <Button 
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => exportCaseTimesToExcel(selectedCaseForTime!)}
          >
            Exportar Tiempos
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleOpenManualTimeDialog(selectedCaseForTime!)}
          >
            Agregar Tiempo Manual
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar tiempo manual */}
      <Dialog open={manualTimeDialogOpen} onClose={() => setManualTimeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agregar Tiempo Manual - {selectedCaseForTime?.case_number}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Horas"
                value={manualTimeForm.hours}
                onChange={(e) => setManualTimeForm({ 
                  ...manualTimeForm, 
                  hours: parseInt(e.target.value) || 0 
                })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Minutos"
                value={manualTimeForm.minutes}
                onChange={(e) => setManualTimeForm({ 
                  ...manualTimeForm, 
                  minutes: parseInt(e.target.value) || 0 
                })}
                inputProps={{ min: 0, max: 59 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                value={manualTimeForm.date}
                onChange={(e) => setManualTimeForm({ 
                  ...manualTimeForm, 
                  date: e.target.value 
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción del trabajo realizado"
                value={manualTimeForm.description}
                onChange={(e) => setManualTimeForm({ 
                  ...manualTimeForm, 
                  description: e.target.value 
                })}
                placeholder="Describa brevemente el trabajo realizado..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualTimeDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveManualTime} 
            variant="contained"
            disabled={manualTimeForm.hours === 0 && manualTimeForm.minutes === 0}
          >
            Guardar Tiempo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para exportar por mes */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Exportar Casos por Mes
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="month"
              label="Seleccionar Mes"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Se exportarán todos los casos creados en el mes seleccionado junto con sus tiempos registrados.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={exportToExcelByMonth} 
            variant="contained"
            startIcon={<ExportIcon />}
          >
            Exportar
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

export default CaseManagement;
