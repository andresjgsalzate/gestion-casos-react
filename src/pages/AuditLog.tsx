import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'react-toastify';

import { auditService, AuditLogEntry, AuditQuery } from '../services/auditService';
import { usePermissions } from '../hooks/usePermissions';

const AuditLog: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState<AuditQuery>({
    limit: 100,
    offset: 0
  });
  const [stats, setStats] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Dayjs>(dayjs().subtract(30, 'day'));
  const [dateTo, setDateTo] = useState<Dayjs>(dayjs());

  const { isAdmin } = usePermissions();

  useEffect(() => {
    if (isAdmin) {
      loadAuditLogs();
      loadStats();
    }
  }, [isAdmin, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const queryFilters = {
        ...filters,
        date_from: dateFrom.format('YYYY-MM-DD'),
        date_to: dateTo.format('YYYY-MM-DD')
      };
      
      const result = await auditService.getAuditLogs(queryFilters);
      setAuditLogs(result.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await auditService.getAuditStats(30);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading audit stats:', error);
    }
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'DELETE':
        return <DeleteIcon color="error" />;
      case 'UPDATE':
        return <EditIcon color="warning" />;
      case 'INSERT':
        return <AddIcon color="success" />;
      default:
        return <ViewIcon color="info" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'DELETE':
        return 'error';
      case 'UPDATE':
        return 'warning';
      case 'INSERT':
        return 'success';
      default:
        return 'info';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Fecha/Hora',
      width: 180,
      valueFormatter: (params: any) => dayjs(params.value).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      field: 'operation',
      headerName: 'Operación',
      width: 120,
      renderCell: (params: any) => (
        <Chip
          icon={getOperationIcon(params.value)}
          label={params.value}
          color={getOperationColor(params.value) as any}
          size="small"
        />
      ),
    },
    { field: 'table_name', headerName: 'Tabla', width: 150 },
    { field: 'record_id', headerName: 'ID Registro', width: 200 },
    { field: 'user_name', headerName: 'Usuario', width: 150 },
    { field: 'description', headerName: 'Descripción', width: 300, flex: 1 },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params: any) => (
        <IconButton
          size="small"
          onClick={() => handleViewDetails(params.row)}
          title="Ver detalles"
        >
          <ViewIcon />
        </IconButton>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon color="error" sx={{ fontSize: 48 }} />
              <Box>
                <Typography variant="h6" color="error">
                  Acceso Denegado
                </Typography>
                <Typography color="text.secondary">
                  Solo los administradores pueden ver los logs de auditoría
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Logs de Auditoría
        </Typography>
      </Box>

      {/* Estadísticas */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Operaciones (30 días)
                </Typography>
                <Typography variant="h4">
                  {stats.totalOperations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Eliminaciones
                </Typography>
                <Typography variant="h4" color="error">
                  {stats.operationsByType?.DELETE || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Modificaciones
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.operationsByType?.UPDATE || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Creaciones
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.operationsByType?.INSERT || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtros</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Fecha Desde"
                value={dateFrom}
                onChange={(newValue) => newValue && setDateFrom(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Fecha Hasta"
                value={dateTo}
                onChange={(newValue) => newValue && setDateTo(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Operación</InputLabel>
                <Select
                  value={filters.operation || ''}
                  onChange={(e) => setFilters({ ...filters, operation: e.target.value || undefined })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="DELETE">Eliminaciones</MenuItem>
                  <MenuItem value="UPDATE">Modificaciones</MenuItem>
                  <MenuItem value="INSERT">Creaciones</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tabla</InputLabel>
                <Select
                  value={filters.table_name || ''}
                  onChange={(e) => setFilters({ ...filters, table_name: e.target.value || undefined })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="users">Usuarios</MenuItem>
                  <MenuItem value="roles">Roles</MenuItem>
                  <MenuItem value="permissions">Permisos</MenuItem>
                  <MenuItem value="applications">Aplicaciones</MenuItem>
                  <MenuItem value="origins">Orígenes</MenuItem>
                  <MenuItem value="priorities">Prioridades</MenuItem>
                  <MenuItem value="cases">Casos</MenuItem>
                  <MenuItem value="todos">TODOs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box mt={2}>
            <Button variant="contained" onClick={loadAuditLogs}>
              Aplicar Filtros
            </Button>
          </Box>
        </LocalizationProvider>
      </Paper>

      {/* Tabla de logs */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={auditLogs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog de detalles */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {selectedLog && getOperationIcon(selectedLog.operation)}
            Detalles del Log de Auditoría
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Operación:
                  </Typography>
                  <Chip
                    icon={getOperationIcon(selectedLog.operation)}
                    label={selectedLog.operation}
                    color={getOperationColor(selectedLog.operation) as any}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha/Hora:
                  </Typography>
                  <Typography>
                    {dayjs(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tabla:
                  </Typography>
                  <Typography>{selectedLog.table_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ID Registro:
                  </Typography>
                  <Typography>{selectedLog.record_id}</Typography>
                </Grid>
                {selectedLog.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Descripción:
                    </Typography>
                    <Typography>{selectedLog.description}</Typography>
                  </Grid>
                )}
                {selectedLog.old_data && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Datos Anteriores:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </Box>
                  </Grid>
                )}
                {selectedLog.new_data && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Datos Nuevos:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLog;
