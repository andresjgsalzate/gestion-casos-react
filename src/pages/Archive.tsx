import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Alert,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { ArchiveService } from '../services/archiveService';
import type { ArchivedCase, ArchivedTodo, ArchiveFilters, ArchiveStats, ArchiveReasonType, RetentionStatusType } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`archive-tabpanel-${index}`}
      aria-labelledby={`archive-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Archive: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [archivedCases, setArchivedCases] = useState<ArchivedCase[]>([]);
  const [archivedTodos, setArchivedTodos] = useState<ArchivedTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArchiveFilters>({
    page: 1,
    limit: 10
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'cases' | 'todos'>('cases');
  const [totalCount, setTotalCount] = useState(0);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArchivedCase | ArchivedTodo | null>(null);

  const loadArchiveStats = async () => {
    try {
      const result = await ArchiveService.getArchiveStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || 'Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error loading archive stats:', err);
      setError('Error al cargar las estadísticas del archivo');
    }
  };

  const loadArchivedItems = useCallback(async () => {
    try {
      setLoading(true);
      
      if (selectedType === 'cases') {
        const result = await ArchiveService.getArchivedCases(filters);
        if (result.success) {
          setArchivedCases(result.data || []);
          setTotalCount(result.count || 0);
        } else {
          setError(result.error || 'Error al cargar casos archivados');
        }
      } else {
        const result = await ArchiveService.getArchivedTodos(filters);
        if (result.success) {
          setArchivedTodos(result.data || []);
          setTotalCount(result.count || 0);
        } else {
          setError(result.error || 'Error al cargar TODOs archivados');
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading archived items:', err);
      setError('Error al cargar elementos archivados');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedType]);

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      searchQuery: searchQuery.trim() || undefined,
      page: 1
    }));
  };

  const handleRestore = async (id: string, type: 'case' | 'todo') => {
    try {
      setLoading(true);
      let result;
      if (type === 'case') {
        result = await ArchiveService.restoreCase(id);
      } else {
        result = await ArchiveService.restoreTodo(id);
      }
      
      if (result.success) {
        // Mostrar mensaje de éxito
        setError(''); // Limpiar errores previos
        
        // Cerrar modal de detalle si está abierto
        if (detailModalOpen) {
          setDetailModalOpen(false);
          setSelectedItem(null);
        }
        
        // Refrescar datos
        await loadArchivedItems(); // Refresh the list
        await loadArchiveStats(); // Refresh stats
        
        // Pequeña pausa para que el usuario vea el cambio
        setTimeout(() => {
          console.log(`${type === 'case' ? 'Caso' : 'TODO'} restaurado exitosamente`);
        }, 500);
      } else {
        setError(result.error || 'Error al restaurar elemento');
      }
    } catch (err) {
      console.error('Error restoring item:', err);
      setError('Error al restaurar elemento');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (item: ArchivedCase | ArchivedTodo) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadArchiveStats();
  }, []);

  useEffect(() => {
    loadArchivedItems();
  }, [loadArchivedItems]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderArchivedItems = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    const items = selectedType === 'cases' ? archivedCases : archivedTodos;

    if (items.length === 0) {
      return (
        <Alert severity="info">
          No hay {selectedType === 'cases' ? 'casos' : 'TODOs'} archivados.
        </Alert>
      );
    }

    return (
      <>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Archivado por</TableCell>
                <TableCell>Fecha de archivo</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>                <TableCell>
                  {selectedType === 'cases' 
                    ? (item as ArchivedCase).original_case_id 
                    : (item as ArchivedTodo).original_todo_id
                  }
                </TableCell>
                <TableCell>
                  {selectedType === 'cases' 
                    ? (item as ArchivedCase).case_data?.description 
                    : (item as ArchivedTodo).todo_data?.title
                  }
                </TableCell>
                  <TableCell>{item.archived_by_user?.name || 'N/A'}</TableCell>
                  <TableCell>{formatDate(item.archived_at)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.archive_reason} 
                      size="small"
                      color={item.archive_reason === 'MANUAL' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.retention_status} 
                      size="small"
                      color={item.retention_status === 'ACTIVE' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver Detalle">
                      <IconButton
                        onClick={() => handleViewDetail(item)}
                        color="info"
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restaurar">
                      <IconButton
                        onClick={() => handleRestore(item.id, selectedType === 'cases' ? 'case' : 'todo')}
                        color="primary"
                        size="small"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination 
            count={Math.ceil(totalCount / (filters.limit || 10))}
            page={filters.page || 1}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </>
    );
  };

  if (error && !stats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
        >
          Reintentar
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <ArchiveIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Archivo de Casos y TODOs
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestiona elementos archivados, consulta estadísticas y configura políticas de retención.
        </Typography>
      </Paper>

      {/* Estadísticas Rápidas */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Casos Archivados
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalArchivedCases || 0}
                    </Typography>
                  </Box>
                  <ArchiveIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      TODOs Archivados
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalArchivedTodos || 0}
                    </Typography>
                  </Box>
                  <ArchiveIcon color="secondary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Este Mes
                    </Typography>
                    <Typography variant="h4">
                      {stats.archivesThisMonth || 0}
                    </Typography>
                  </Box>
                  <AnalyticsIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Próximos a Expirar
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.nearingRetention || 0}
                    </Typography>
                  </Box>
                  <Chip 
                    label="30 días" 
                    color="warning" 
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs de Contenido */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            aria-label="archive tabs"
          >
            <Tab 
              icon={<RestoreIcon />} 
              label="Elementos Archivados" 
              id="archive-tab-0"
              aria-controls="archive-tabpanel-0"
            />
            <Tab 
              icon={<SearchIcon />} 
              label="Búsqueda Avanzada" 
              id="archive-tab-1"
              aria-controls="archive-tabpanel-1"
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Elementos Archivados
          </Typography>
          
          {/* Controles de filtro */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={selectedType}
                  label="Tipo"
                  onChange={(e) => setSelectedType(e.target.value as 'cases' | 'todos')}
                >
                  <MenuItem value="cases">Casos</MenuItem>
                  <MenuItem value="todos">TODOs</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 200 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
              >
                Buscar
              </Button>
              
              <Tooltip title="Actualizar">
                <IconButton onClick={loadArchivedItems}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {renderArchivedItems()}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Búsqueda Avanzada
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Filtros Avanzados
                  </Typography>
                  
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Motivo de Archivo</InputLabel>
                      <Select
                        value={filters.archiveReason || ''}
                        label="Motivo de Archivo"
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          archiveReason: (e.target.value as ArchiveReasonType) || undefined,
                          page: 1
                        }))}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="MANUAL">Manual</MenuItem>
                        <MenuItem value="AUTO_TIME_BASED">Automático por Tiempo</MenuItem>
                        <MenuItem value="AUTO_INACTIVITY">Automático por Inactividad</MenuItem>
                        <MenuItem value="POLICY_COMPLIANCE">Cumplimiento de Política</MenuItem>
                        <MenuItem value="BULK_OPERATION">Operación Masiva</MenuItem>
                        <MenuItem value="USER_REQUEST">Solicitud de Usuario</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Estado de Retención</InputLabel>
                      <Select
                        value={filters.retentionStatus || ''}
                        label="Estado de Retención"
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          retentionStatus: (e.target.value as RetentionStatusType) || undefined,
                          page: 1
                        }))}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="ACTIVE">Activo</MenuItem>
                        <MenuItem value="WARNING">Próximo a Expirar</MenuItem>
                        <MenuItem value="EXPIRED">Expirado</MenuItem>
                        <MenuItem value="LEGAL_HOLD">Retención Legal</MenuItem>
                        <MenuItem value="PENDING_DELETION">Pendiente de Eliminación</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Fecha de Inicio"
                      value={filters.startDate || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        startDate: e.target.value || undefined,
                        page: 1
                      }))}
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Fecha de Fin"
                      value={filters.endDate || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        endDate: e.target.value || undefined,
                        page: 1
                      }))}
                      InputLabelProps={{ shrink: true }}
                    />

                    <Button
                      variant="contained"
                      onClick={() => setFilters({ page: 1, limit: 10 })}
                      fullWidth
                    >
                      Limpiar Filtros
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Búsqueda por Texto
                  </Typography>
                  
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Buscar en título, descripción, contenido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleSearch}
                      fullWidth
                    >
                      Buscar en Archivo
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Mostrar resultados de búsqueda si existen */}
          {(archivedCases.length > 0 || archivedTodos.length > 0) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resultados de Búsqueda
              </Typography>
              {renderArchivedItems()}
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Modal de Detalle */}
      <Dialog
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Detalle de {selectedType === 'cases' ? 'Caso' : 'TODO'} Archivado
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseDetailModal}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedItem && (
            <Box sx={{ p: 2 }}>
              {/* Información Principal */}
              <Typography variant="h6" gutterBottom>
                {selectedType === 'cases' 
                  ? (selectedItem as ArchivedCase).case_data?.description 
                  : (selectedItem as ArchivedTodo).todo_data?.title
                }
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Información de Archivo */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Archivado por:</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedItem.archived_by_user?.name || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Fecha de archivo:</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formatDate(selectedItem.archived_at)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Motivo:</strong>
                  </Typography>
                  <Chip 
                    label={selectedItem.archive_reason} 
                    size="small"
                    color={selectedItem.archive_reason === 'MANUAL' ? 'primary' : 'default'}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Estado:</strong>
                  </Typography>
                  <Chip 
                    label={selectedItem.retention_status} 
                    size="small"
                    color={selectedItem.retention_status === 'ACTIVE' ? 'success' : 'warning'}
                  />
                </Grid>
                
                {selectedItem.archive_reason_text && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Razón del archivo:</strong>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {selectedItem.archive_reason_text}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Retención hasta:</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formatDate(selectedItem.retention_until)}
                  </Typography>
                </Grid>
                
                {selectedItem.is_legal_hold && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Retención Legal:</strong>
                    </Typography>
                    <Chip label="Sí" color="error" size="small" />
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Detalles específicos del tipo */}
              <Typography variant="h6" gutterBottom>
                Detalles {selectedType === 'cases' ? 'del Caso' : 'del TODO'}
              </Typography>
              
              <Grid container spacing={2}>
                {selectedType === 'cases' ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Número de Caso:</strong>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {(selectedItem as ArchivedCase).case_number}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Estado del Caso:</strong>
                      </Typography>
                      <Chip 
                        label={(selectedItem as ArchivedCase).case_data?.status} 
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Complejidad:</strong>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {(selectedItem as ArchivedCase).case_data?.complexity}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Fecha de Creación:</strong>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {formatDate((selectedItem as ArchivedCase).case_data?.created_at || '')}
                      </Typography>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Descripción:</strong>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {(selectedItem as ArchivedTodo).todo_data?.description || 'Sin descripción'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Estado del TODO:</strong>
                      </Typography>
                      <Chip 
                        label={(selectedItem as ArchivedTodo).todo_data?.status} 
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Prioridad:</strong>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {(() => {
                          const todoData = (selectedItem as ArchivedTodo).todo_data;
                          const priority = todoData?.priority;
                          if (typeof priority === 'string') {
                            return priority;
                          } else if (priority && typeof priority === 'object' && 'name' in priority) {
                            return priority.name;
                          } else if (todoData?.priority_name) {
                            return todoData.priority_name;
                          }
                          return 'No especificada';
                        })()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Fecha de Creación:</strong>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {formatDate((selectedItem as ArchivedTodo).todo_data?.created_at || '')}
                      </Typography>
                    </Grid>
                    
                    {(selectedItem as ArchivedTodo).todo_data?.due_date && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Fecha Límite:</strong>
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {formatDate((selectedItem as ArchivedTodo).todo_data?.due_date!)}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => {
              if (selectedItem) {
                handleRestore(selectedItem.id, selectedType === 'cases' ? 'case' : 'todo');
                handleCloseDetailModal();
              }
            }}
            color="primary"
            variant="contained"
            startIcon={<RestoreIcon />}
          >
            Restaurar
          </Button>
          <Button onClick={handleCloseDetailModal} color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Archive;