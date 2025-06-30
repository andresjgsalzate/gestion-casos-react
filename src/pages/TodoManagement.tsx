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
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Assignment as TodoIcon,
  Timer as TimerIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CancelIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

import { 
  todoService, 
  priorityService, 
  userService,
  caseService,
  timeService 
} from '../services/api';
import { ArchiveService } from '../services/archiveService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useReferentialIntegrity } from '../hooks/useReferentialIntegrity';
import { Todo, Priority, User, Case, TodoFormData } from '../types';
import { useAuditLogger } from '../services/auditService';

const TodoManagement: React.FC = () => {
  const { logAction } = useAuditLogger();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [manualTimeDialogOpen, setManualTimeDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [selectedTodoForTime, setSelectedTodoForTime] = useState<Todo | null>(null);
  const [selectedTodoForArchive, setSelectedTodoForArchive] = useState<Todo | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [timer, setTimer] = useState({ 
    running: false, 
    seconds: 0, 
    todoId: null as string | null,
    timeEntryId: null as string | null 
  });
  const [manualTimeForm, setManualTimeForm] = useState({
    hours: 0,
    minutes: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    priority_id: '',
    assigned_to: '',
    due_date: '',
    case_id: '',
  });

  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();
  const { safeExecute } = useReferentialIntegrity();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [todosData, prioritiesData, usersData, casesData] = await Promise.all([
        todoService.getAll(user?.id, isAdmin),
        priorityService.getAll(),
        userService.getAll(),
        caseService.getAll(user?.id, isAdmin),
      ]);

      setTodos(todosData);
      setPriorities(prioritiesData);
      setUsers(usersData);
      setCases(casesData);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.running) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.running]);

  const handleOpenDialog = (todoData?: Todo) => {
    if (todoData) {
      setSelectedTodo(todoData);
      setFormData({
        title: todoData.title,
        description: todoData.description || '',
        priority_id: todoData.priority_id,
        assigned_to: todoData.assigned_to,
        due_date: todoData.due_date || '',
        case_id: todoData.case_id || '',
      });
    } else {
      setSelectedTodo(null);
      setFormData({
        title: '',
        description: '',
        priority_id: '',
        assigned_to: user?.id || '',
        due_date: '',
        case_id: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTodo(null);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Error: Usuario no autenticado');
      return;
    }

    // Validar campos obligatorios
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!formData.priority_id) {
      toast.error('La prioridad es obligatoria');
      return;
    }
    if (!formData.assigned_to) {
      toast.error('Debe asignar el TODO a un usuario');
      return;
    }

    const result = await safeExecute(async () => {
      if (selectedTodo) {
        const oldData = { ...selectedTodo };
        await todoService.update(selectedTodo.id, formData);
        
        // Auditoría
        await logAction('todos', 'UPDATE', selectedTodo.id, user?.id, 
          `TODO "${selectedTodo.title}" actualizado`, oldData, { ...oldData, ...formData });
        
        return 'actualizado';
      } else {
        const newTodo = await todoService.create(formData, user.id);
        
        // Auditoría
        await logAction('todos', 'INSERT', newTodo.id, user?.id, 
          `TODO "${formData.title}" creado`, undefined, formData);
        
        return 'creado';
      }
    }, 'Guardar TODO');

    if (result) {
      toast.success(`TODO ${result} exitosamente`);
      handleCloseDialog();
      loadData();
    }
  };

  const handleDelete = async (todoId: string) => {
    showConfirmDialog(
      'Eliminar TODO',
      '¿Está seguro de que desea eliminar este TODO? Esta acción no se puede deshacer',
      async () => {
        const result = await safeExecute(async () => {
          const todoToDelete = todos.find(t => t.id === todoId);
          await todoService.delete(todoId);
          
          // Auditoría
          if (todoToDelete) {
            await logAction('todos', 'DELETE', todoId, user?.id, 
              `TODO "${todoToDelete.title}" eliminado`, todoToDelete, undefined);
          }
          
          return true;
        }, 'Eliminar TODO');

        if (result) {
          toast.success('TODO eliminado exitosamente');
          loadData();
        }
      }
    );
  };

  const handleStatusChange = async (todoId: string, status: Todo['status']) => {
    try {
      const todoToUpdate = todos.find(t => t.id === todoId);
      const oldStatus = todoToUpdate?.status;
      
      await todoService.updateStatus(todoId, status);
      
      // Auditoría
      if (todoToUpdate) {
        await logAction('todos', 'UPDATE', todoId, user?.id, 
          `Estado del TODO "${todoToUpdate.title}" cambiado de ${oldStatus} a ${status}`, 
          { ...todoToUpdate, status: oldStatus }, { ...todoToUpdate, status });
      }
      
      toast.success('Estado actualizado exitosamente');
      loadData();
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error(error);
    }
  };

  const handleStartTimer = async (todoId: string) => {
    try {
      if (!user) return;
      
      await timeService.startTimer(undefined, todoId, user.id);
      setTimer({ running: true, seconds: 0, todoId, timeEntryId: null });
      toast.success('Timer iniciado');
    } catch (error) {
      toast.error('Error al iniciar el timer');
      console.error(error);
    }
  };

  const handleStopTimer = async () => {
    try {
      if (timer.todoId) {
        await todoService.updateStatus(timer.todoId, 'IN_PROGRESS');
        setTimer({ running: false, seconds: 0, todoId: null, timeEntryId: null });
        toast.success('Timer detenido y TODO actualizado');
        loadData();
      }
    } catch (error) {
      toast.error('Error al detener el timer');
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Funciones para gestión de tiempos
  const handleOpenTimeDialog = async (todo: Todo) => {
    setSelectedTodoForTime(todo);
    try {
      const timeData = await timeService.getTimeTrackingByTodo(todo.id);
      setTimeEntries(timeData);
      setTimeDialogOpen(true);
    } catch (error) {
      toast.error('Error al cargar los tiempos registrados');
      console.error(error);
    }
  };

  const handleOpenManualTimeDialog = (todo: Todo) => {
    setSelectedTodoForTime(todo);
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
      if (!user || !selectedTodoForTime) return;

      const totalSeconds = (manualTimeForm.hours * 3600) + (manualTimeForm.minutes * 60);
      const startTime = new Date(manualTimeForm.date).toISOString();
      const endTime = new Date(new Date(manualTimeForm.date).getTime() + (totalSeconds * 1000)).toISOString();

      const { error } = await supabase
        .from('time_tracking')
        .insert({
          todo_id: selectedTodoForTime.id,
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
        handleOpenTimeDialog(selectedTodoForTime);
      }
    } catch (error) {
      toast.error('Error al agregar tiempo manual');
      console.error(error);
    }
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

  const handleDeleteTimeEntry = async (timeEntryId: string) => {
    showConfirmDialog(
      'Eliminar Registro de Tiempo',
      '¿Está seguro de que desea eliminar este registro de tiempo? Esta acción no se puede deshacer.',
      async () => {
        try {
          const { error } = await supabase
            .from('time_tracking')
            .delete()
            .eq('id', timeEntryId);

          if (error) throw error;

          toast.success('Registro de tiempo eliminado exitosamente');
          if (selectedTodoForTime) {
            handleOpenTimeDialog(selectedTodoForTime);
          }
        } catch (error) {
          toast.error('Error al eliminar el registro de tiempo');
          console.error(error);
        }
      }
    );
  };

  // Funciones para archivo manual de TODOs
  const handleOpenArchiveDialog = (todoData: Todo) => {
    // Validar que solo se puedan archivar TODOs completados
    if (todoData.status !== 'COMPLETED') {
      toast.error('Solo se pueden archivar TODOs con estado "COMPLETED"');
      return;
    }
    
    setSelectedTodoForArchive(todoData);
    setArchiveReason('');
    setArchiveDialogOpen(true);
  };

  const handleArchiveTodo = async () => {
    try {
      if (!selectedTodoForArchive || !user) return;
      
      if (!archiveReason.trim()) {
        toast.error('Debe proporcionar una razón para archivar el TODO');
        return;
      }

      const result = await ArchiveService.archiveTodo(
        selectedTodoForArchive.id,
        'MANUAL',
        archiveReason.trim()
      );

      if (result.success) {
        toast.success('TODO archivado exitosamente');
        setArchiveDialogOpen(false);
        setSelectedTodoForArchive(null);
        setArchiveReason('');
        loadData(); // Recargar la lista de TODOs
      } else {
        toast.error(result.error || 'Error al archivar el TODO');
      }
    } catch (error) {
      toast.error('Error al archivar el TODO');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      case 'PENDING': return 'Pendiente';
      default: return status;
    }
  };

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Título', width: 200, flex: 1 },
    { field: 'description', headerName: 'Descripción', width: 250 },
    {
      field: 'status',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusText(params.value)}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    { field: 'priority_name', headerName: 'Prioridad', width: 120 },
    { field: 'assigned_to_name', headerName: 'Asignado a', width: 150 },
    { field: 'created_by_name', headerName: 'Creado por', width: 150 },
    { field: 'case_number', headerName: 'Caso', width: 120 },
    {
      field: 'due_date',
      headerName: 'Fecha Límite',
      width: 130,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '',
    },
    {
      field: 'created_at',
      headerName: 'Fecha Creación',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'times',
      headerName: 'Tiempos',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleOpenTimeDialog(params.row)}
            title="Ver tiempos registrados"
          >
            <TimerIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenManualTimeDialog(params.row)}
            title="Agregar tiempo manual"
          >
            <ScheduleIcon />
          </IconButton>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 240,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleStartTimer(params.row.id)}
            disabled={timer.running || params.row.status === 'COMPLETED'}
          >
            <PlayIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleStatusChange(params.row.id, 'COMPLETED')}
            disabled={params.row.status === 'COMPLETED'}
          >
            <CompleteIcon />
          </IconButton>
          {params.row.status === 'COMPLETED' && (
            <IconButton 
              size="small" 
              onClick={() => handleOpenArchiveDialog(params.row)}
              title="Archivar TODO"
              color="warning"
            >
              <ArchiveIcon />
            </IconButton>
          )}
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

  const myTodos = todos.filter(todo => todo.assigned_to === user?.id);
  const pendingTodos = myTodos.filter(todo => todo.status === 'PENDING');
  const inProgressTodos = myTodos.filter(todo => todo.status === 'IN_PROGRESS');
  const completedTodos = myTodos.filter(todo => todo.status === 'COMPLETED');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Gestión de TODOs</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo TODO
          </Button>
        </Box>

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TodoIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pendientes
                    </Typography>
                    <Typography variant="h4">
                      {pendingTodos.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TodoIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      En Progreso
                    </Typography>
                    <Typography variant="h4">
                      {inProgressTodos.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TodoIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completados
                    </Typography>
                    <Typography variant="h4">
                      {completedTodos.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TodoIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total
                    </Typography>
                    <Typography variant="h4">
                      {myTodos.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Timer */}
        {timer.running && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Typography variant="h6" color="white" sx={{ mr: 2 }}>
                    Trabajando en TODO:
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatTime(timer.seconds)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStopTimer}
                >
                  Detener
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Tabla de TODOs */}
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={todos}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
          />
        </Paper>

        {/* Dialog para crear/editar TODO */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedTodo ? 'Editar TODO' : 'Nuevo TODO'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
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

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={formData.priority_id}
                    onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
                    required
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.id} value={priority.id}>
                        {priority.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Asignado a</InputLabel>
                  <Select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    required
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha Límite"
                  value={formData.due_date ? dayjs(formData.due_date) : null}
                  onChange={(newValue) => 
                    setFormData({ 
                      ...formData, 
                      due_date: newValue ? newValue.format('YYYY-MM-DD') : '' 
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Caso Relacionado (Opcional)</InputLabel>
                  <Select
                    value={formData.case_id}
                    onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                  >
                    <MenuItem value="">Ninguno</MenuItem>
                    {cases.map((caso) => (
                      <MenuItem key={caso.id} value={caso.id}>
                        {caso.case_number} - {caso.description.substring(0, 50)}...
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
              {selectedTodo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para ver tiempos registrados */}
        <Dialog open={timeDialogOpen} onClose={() => setTimeDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Tiempos Registrados - {selectedTodoForTime?.title}
            <Typography variant="subtitle2" color="text.secondary">
              Total: {timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0) > 0 
                ? `${Math.floor(timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0) / 3600)}h ${Math.floor((timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0) % 3600) / 60)}m`
                : '0h 0m'
              }
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
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
                        {entry.end_time ? new Date(entry.start_time).toLocaleTimeString() : 'En curso'}
                      </TableCell>
                      <TableCell>
                        {entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.duration_seconds 
                          ? `${Math.floor(entry.duration_seconds / 3600)}h ${Math.floor((entry.duration_seconds % 3600) / 60)}m`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{entry.description || '-'}</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteTimeEntry(entry.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {timeEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay tiempos registrados
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
              onClick={() => {
                setTimeDialogOpen(false);
                if (selectedTodoForTime) handleOpenManualTimeDialog(selectedTodoForTime);
              }}
              variant="contained"
              startIcon={<ScheduleIcon />}
            >
              Agregar Tiempo Manual
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para agregar tiempo manual */}
        <Dialog open={manualTimeDialogOpen} onClose={() => setManualTimeDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Agregar Tiempo Manual - {selectedTodoForTime?.title}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
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
              <Grid item xs={6}>
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
                  label="Descripción"
                  value={manualTimeForm.description}
                  onChange={(e) => setManualTimeForm({ 
                    ...manualTimeForm, 
                    description: e.target.value 
                  })}
                  placeholder="Describe el trabajo realizado..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManualTimeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveManualTime} variant="contained">
              Guardar Tiempo
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

        {/* Dialog para archivo manual */}
        <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Archivar TODO - {selectedTodoForArchive?.title}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              ¿Está seguro de que desea archivar este TODO? Esta acción no se puede deshacer.
            </Typography>
            <TextField
              fullWidth
              label="Razón del archivo"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              sx={{ mt: 2 }}
              multiline
              rows={3}
              placeholder="Describa la razón por la cual se archiva este TODO..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setArchiveDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleArchiveTodo} 
              variant="contained"
              color="primary"
              startIcon={<ArchiveIcon />}
              disabled={!archiveReason.trim()}
            >
              Archivar TODO
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TodoManagement;
