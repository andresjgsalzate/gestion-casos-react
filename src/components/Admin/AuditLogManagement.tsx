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
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
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

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
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
                  <MenuItem value="cases">Casos</MenuItem>
                  <MenuItem value="users">Usuarios</MenuItem>
                  <MenuItem value="roles">Roles</MenuItem>
                  <MenuItem value="applications">Aplicaciones</MenuItem>
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
                      <Tooltip 
                        title={
                          <pre style={{ whiteSpace: 'pre-wrap', maxWidth: 400 }}>
                            {log.old_values && (
                              <>
                                <strong>Valores Anteriores:</strong>
                                {'\n'}
                                {formatJsonData(log.old_values)}
                                {'\n\n'}
                              </>
                            )}
                            {log.new_values && (
                              <>
                                <strong>Valores Nuevos:</strong>
                                {'\n'}
                                {formatJsonData(log.new_values)}
                              </>
                            )}
                          </pre>
                        }
                        placement="left"
                      >
                        <IconButton size="small">
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
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogManagement;
