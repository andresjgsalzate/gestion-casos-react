import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { auditService } from '../../services/auditService';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface AuditStats {
  total_actions: number;
  total_users: number;
  actions_today: number;
  actions_this_week: number;
  top_actions: Array<{ action: string; count: number }>;
  top_users: Array<{ user_name: string; count: number }>;
}

const AuditLogManagement: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rlsWarning, setRlsWarning] = useState(false);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  
  // Modal de detalles
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolvedNames, setResolvedNames] = useState<{
    users: Record<string, string>;
    priorities: Record<string, string>;
    applications: Record<string, string>;
    origins: Record<string, string>;
    roles: Record<string, string>;
  }>({
    users: {},
    priorities: {},
    applications: {},
    origins: {},
    roles: {},
  });
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    table_name: '',
    user_id: '',
    start_date: null as Dayjs | null,
    end_date: null as Dayjs | null,
  });

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setRlsWarning(false);
      
      const response = await auditService.getAuditLogs({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        action: filters.action || undefined,
        table_name: filters.table_name || undefined,
        user_id: filters.user_id || undefined,
        start_date: filters.start_date?.format('YYYY-MM-DD') || undefined,
        end_date: filters.end_date?.format('YYYY-MM-DD') || undefined,
      });
      
      setLogs(response.data || []);
      setTotalCount(response.total || 0);
      
      // Extraer tablas únicas para el filtro
      const uniqueTables = Array.from(new Set(response.data?.map(log => log.table_name) || [])).sort();
      setAvailableTables(uniqueTables);
      
      // Verificar si es debido a problemas de RLS
      if ('rlsError' in response && response.rlsError) {
        setRlsWarning(true);
      }
    } catch (err: any) {
      console.error('Error al cargar logs:', err);
      setError('Error al cargar los logs de auditoría: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  const loadAuditStats = useCallback(async () => {
    try {
      const response = await auditService.getAuditStats();
      setStats(response);
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadAuditLogs();
    loadAuditStats();
  }, [loadAuditLogs, loadAuditStats]);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      action: '',
      table_name: '',
      user_id: '',
      start_date: null,
      end_date: null,
    });
  };

  const handleExport = async () => {
    try {
      const response = await auditService.exportAuditLogs({
        search: filters.search || undefined,
        action: filters.action || undefined,
        table_name: filters.table_name || undefined,
        user_id: filters.user_id || undefined,
        start_date: filters.start_date?.format('YYYY-MM-DD') || undefined,
        end_date: filters.end_date?.format('YYYY-MM-DD') || undefined,
      });
      
      // Crear y descargar archivo CSV
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Error al exportar logs: ' + err.message);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return <SuccessIcon color="success" fontSize="small" />;
      case 'update':
        return <InfoIcon color="info" fontSize="small" />;
      case 'delete':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <WarningIcon color="warning" fontSize="small" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Función para formatear JSON con nombres legibles
  const formatJsonDataWithNames = (data: any) => {
    if (!data) return 'N/A';
    
    try {
      // Crear una copia del objeto para no modificar el original
      const formattedData = { ...data };
      
      // Mapear campos comunes con nombres más legibles
      const fieldMappings: Record<string, string> = {
        // Usuario campos
        'created_by': 'Creado por',
        'assigned_to': 'Asignado a', 
        'user_id': 'Usuario',
        
        // Prioridad
        'priority_id': 'Prioridad',
        
        // Aplicación
        'application_id': 'Aplicación',
        
        // Origen
        'origin_id': 'Origen',
        
        // Rol
        'role_id': 'Rol',
        
        // Caso
        'case_id': 'Caso',
        
        // TODO
        'todo_id': 'TODO',
        
        // Estados más legibles
        'status': 'Estado',
        'complexity': 'Complejidad',
        'classification': 'Clasificación',
        'operation': 'Operación',
        
        // Fechas más legibles
        'created_at': 'Fecha de Creación',
        'updated_at': 'Fecha de Actualización',
        'completed_at': 'Fecha de Finalización',
        'due_date': 'Fecha Límite',
        'start_time': 'Hora de Inicio',
        'end_time': 'Hora de Fin',
        
        // Otros campos
        'case_number': 'Número de Caso',
        'title': 'Título',
        'description': 'Descripción',
        'duration_seconds': 'Duración (segundos)',
        'classification_score': 'Puntuación de Clasificación',
        'is_active': 'Activo',
        'name': 'Nombre',
        'email': 'Correo Electrónico',
        'password': 'Contraseña (Hash)'
      };

      // Mapear estados a español
      const statusMappings: Record<string, string> = {
        'PENDING': 'Pendiente',
        'PENDIENTE': 'Pendiente',
        'IN_PROGRESS': 'En Progreso',
        'EN CURSO': 'En Progreso',
        'COMPLETED': 'Completado',
        'TERMINADA': 'Terminado',
        'ESCALADA': 'Escalado',
        'CANCELLED': 'Cancelado',
        
        // Complejidad
        'BAJO': 'Baja',
        'MEDIO': 'Media', 
        'ALTO': 'Alta',
        
        // Operaciones
        'INSERT': 'Crear',
        'UPDATE': 'Actualizar',
        'DELETE': 'Eliminar',
        'SELECT': 'Consultar'
      };

      // Aplicar traducciones
      Object.keys(formattedData).forEach(key => {
        const value = formattedData[key];
        
        // Resolver nombres de IDs antes de otros procesados
        let resolvedValue = value;
        if (typeof value === 'string') {
          // Resolver IDs de usuario
          if ((key === 'created_by' || key === 'assigned_to' || key === 'user_id') && resolvedNames.users[value]) {
            resolvedValue = `${resolvedNames.users[value]} (ID: ${value})`;
          }
          // Resolver IDs de prioridad
          else if (key === 'priority_id' && resolvedNames.priorities[value]) {
            resolvedValue = `${resolvedNames.priorities[value]} (ID: ${value})`;
          }
          // Resolver IDs de aplicación
          else if (key === 'application_id' && resolvedNames.applications[value]) {
            resolvedValue = `${resolvedNames.applications[value]} (ID: ${value})`;
          }
          // Resolver IDs de origen
          else if (key === 'origin_id' && resolvedNames.origins[value]) {
            resolvedValue = `${resolvedNames.origins[value]} (ID: ${value})`;
          }
          // Resolver IDs de rol
          else if (key === 'role_id' && resolvedNames.roles[value]) {
            resolvedValue = `${resolvedNames.roles[value]} (ID: ${value})`;
          }
        }
        
        // Traducir nombres de campos
        if (fieldMappings[key]) {
          const newKey = fieldMappings[key];
          formattedData[newKey] = resolvedValue;
          delete formattedData[key];
        } else {
          formattedData[key] = resolvedValue;
        }
        
        // Traducir valores de estado
        if (typeof resolvedValue === 'string' && statusMappings[resolvedValue]) {
          const translatedKey = fieldMappings[key] || key;
          formattedData[translatedKey] = `${statusMappings[resolvedValue]} (${resolvedValue})`;
        }
        
        // Formatear fechas
        if (key.includes('_at') || key.includes('_time') || key === 'due_date') {
          if (resolvedValue && typeof resolvedValue === 'string' && !resolvedValue.includes('ID:')) {
            try {
              const date = new Date(resolvedValue);
              if (!isNaN(date.getTime())) {
                const translatedKey = fieldMappings[key] || key;
                formattedData[translatedKey] = `${dayjs(resolvedValue).format('DD/MM/YYYY HH:mm:ss')} (${resolvedValue})`;
              }
            } catch (e) {
              // Si no se puede parsear como fecha, dejar como está
            }
          }
        }
        
        // Formatear booleanos
        if (typeof resolvedValue === 'boolean') {
          const translatedKey = fieldMappings[key] || key;
          formattedData[translatedKey] = resolvedValue ? 'Sí' : 'No';
        }
        
        // Formatear números grandes (posibles UUIDs)
        if (typeof resolvedValue === 'string' && !resolvedValue.includes('ID:') && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(resolvedValue)) {
          // Es un UUID, agregar etiqueta
          const translatedKey = fieldMappings[key] || key;
          formattedData[translatedKey] = `${resolvedValue.substring(0, 8)}...${resolvedValue.substring(resolvedValue.length - 8)} (UUID)`;
        }
      });

      return JSON.stringify(formattedData, null, 2);
    } catch (error) {
      // Si hay algún error, volver al formato original
      return JSON.stringify(data, null, 2);
    }
  };

  // Funciones para el modal de detalles
  const handleOpenDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    setModalOpen(true);
    
    // Extraer IDs que necesitamos resolver
    const idsData = extractIdsFromLog(log);
    
    try {
      // Resolver nombres usando el servicio (solo IDs de usuario por ahora)
      const userIds = idsData.userIds || [];
      const userNames = await auditService.resolveNames(userIds);
      setResolvedNames(prev => ({
        ...prev,
        users: userNames
      }));
    } catch (error) {
      console.error('Error resolviendo nombres:', error);
      // Si falla, usar nombres vacíos
      setResolvedNames({
        users: {},
        priorities: {},
        applications: {},
        origins: {},
        roles: {},
      });
    }
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
    setModalOpen(false);
    setResolvedNames({
      users: {},
      priorities: {},
      applications: {},
      origins: {},
      roles: {},
    });
  };

  // Función para extraer IDs que necesitan resolución de nombres
  const extractIdsFromLog = (log: AuditLog) => {
    const ids: {
      userIds?: string[];
      priorityIds?: string[];
      applicationIds?: string[];
      originIds?: string[];
      roleIds?: string[];
    } = {};

    const allData = { ...log.old_values, ...log.new_values };
    
    // Extraer IDs de usuario
    const userIds = new Set<string>();
    if (log.user_id) userIds.add(log.user_id);
    if (allData.created_by) userIds.add(allData.created_by);
    if (allData.assigned_to) userIds.add(allData.assigned_to);
    if (allData.user_id) userIds.add(allData.user_id);
    if (userIds.size > 0) ids.userIds = Array.from(userIds);

    // Extraer IDs de prioridad
    const priorityIds = new Set<string>();
    if (allData.priority_id) priorityIds.add(allData.priority_id);
    if (priorityIds.size > 0) ids.priorityIds = Array.from(priorityIds);

    // Extraer IDs de aplicación
    const applicationIds = new Set<string>();
    if (allData.application_id) applicationIds.add(allData.application_id);
    if (applicationIds.size > 0) ids.applicationIds = Array.from(applicationIds);

    // Extraer IDs de origen
    const originIds = new Set<string>();
    if (allData.origin_id) originIds.add(allData.origin_id);
    if (originIds.size > 0) ids.originIds = Array.from(originIds);

    // Extraer IDs de rol
    const roleIds = new Set<string>();
    if (allData.role_id) roleIds.add(allData.role_id);
    if (roleIds.size > 0) ids.roleIds = Array.from(roleIds);

    return ids;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Logs de Auditoría
        </Typography>

        {/* Estadísticas */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Acciones
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_actions.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Usuarios Activos
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_users}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Acciones Hoy
                  </Typography>
                  <Typography variant="h4">
                    {stats.actions_today}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Acciones Esta Semana
                  </Typography>
                  <Typography variant="h4">
                    {stats.actions_this_week}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Alerta de problema de RLS */}
        {rlsWarning && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setRlsWarning(false)}
              >
                Entendido
              </Button>
            }
          >
            <strong>⚠️ Problema de Row Level Security (RLS)</strong>
            <br />
            Los datos de auditoría existen en la base de datos pero no son accesibles desde la aplicación 
            debido a las políticas de Row Level Security en Supabase. Se están mostrando datos de ejemplo.
            <br />
            <strong>Solución:</strong> Configurar las políticas RLS en Supabase para permitir SELECT en la tabla audit_logs.
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Buscar"
                variant="outlined"
                size="small"
                fullWidth
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Acción</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Acción"
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="create">Crear</MenuItem>
                  <MenuItem value="update">Actualizar</MenuItem>
                  <MenuItem value="delete">Eliminar</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Tabla</InputLabel>
                <Select
                  value={filters.table_name}
                  onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  label="Tabla"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {availableTables.map(table => (
                    <MenuItem key={table} value={table}>
                      {table === 'cases' ? 'Casos' :
                       table === 'users' ? 'Usuarios' :
                       table === 'roles' ? 'Roles' :
                       table === 'applications' ? 'Aplicaciones' :
                       table === 'todos' ? 'TODOs' :
                       table === 'priorities' ? 'Prioridades' :
                       table === 'origins' ? 'Orígenes' :
                       table.charAt(0).toUpperCase() + table.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Fecha Inicio"
                value={filters.start_date}
                onChange={(date) => handleFilterChange('start_date', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Fecha Fin"
                value={filters.end_date}
                onChange={(date) => handleFilterChange('end_date', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Actualizar">
                  <IconButton onClick={loadAuditLogs} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Exportar">
                  <IconButton onClick={handleExport}>
                    <ExportIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 1 }}>
            <Button variant="outlined" size="small" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabla de logs */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha/Hora</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Tabla</TableCell>
                <TableCell>Registro ID</TableCell>
                <TableCell>Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron logs de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      {dayjs(log.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </TableCell>
                    <TableCell>{log.user_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getActionIcon(log.action)}
                        <Chip
                          label={log.action}
                          size="small"
                          color={getActionColor(log.action) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{log.table_name}</TableCell>
                    <TableCell>{log.record_id}</TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles completos">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDetails(log)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>

        {/* Modal de detalles */}
        <Dialog 
          open={modalOpen} 
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Detalles del Log de Auditoría
              </Typography>
              <IconButton onClick={handleCloseDetails} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            {selectedLog && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Información básica */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Información General
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          ID del Log
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                          {selectedLog.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Fecha/Hora
                        </Typography>
                        <Typography variant="body1">
                          {dayjs(selectedLog.created_at).format('DD/MM/YYYY HH:mm:ss')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Usuario
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.user_name || 
                           (selectedLog.user_id && resolvedNames.users[selectedLog.user_id]) || 
                           'Sistema'}
                        </Typography>
                        {selectedLog.user_id && (
                          <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                            ID: {selectedLog.user_id}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Acción
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getActionIcon(selectedLog.action)}
                          <Chip
                            label={selectedLog.action}
                            size="small"
                            color={getActionColor(selectedLog.action) as any}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Tabla
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.table_name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          ID del Registro
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                          {selectedLog.record_id}
                        </Typography>
                      </Grid>
                      {selectedLog.ip_address && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Dirección IP
                          </Typography>
                          <Typography variant="body1">
                            {selectedLog.ip_address}
                          </Typography>
                        </Grid>
                      )}
                      {selectedLog.user_agent && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            User Agent
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.8em',
                            wordBreak: 'break-all'
                          }}>
                            {selectedLog.user_agent}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Valores anteriores */}
                {selectedLog.old_values && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="warning.main">
                        Valores Anteriores
                      </Typography>
                      <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                        <pre style={{ 
                          margin: 0, 
                          fontFamily: 'monospace', 
                          fontSize: '0.85em',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {formatJsonDataWithNames(selectedLog.old_values)}
                        </pre>
                      </Paper>
                    </CardContent>
                  </Card>
                )}

                {/* Valores nuevos */}
                {selectedLog.new_values && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="success.main">
                        Valores Nuevos
                      </Typography>
                      <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                        <pre style={{ 
                          margin: 0, 
                          fontFamily: 'monospace', 
                          fontSize: '0.85em',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {formatJsonDataWithNames(selectedLog.new_values)}
                        </pre>
                      </Paper>
                    </CardContent>
                  </Card>
                )}

                {/* Metadatos adicionales */}
                {(selectedLog.user_id || selectedLog.record_id) && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="info.main">
                        Metadatos
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedLog.user_id && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                              User ID
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                              {selectedLog.user_id}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDetails} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogManagement;
