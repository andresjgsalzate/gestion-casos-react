import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItemText,
  ListItemButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  CircularProgress,
  Alert,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  DateRange as DateIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArchiveFilters, ArchiveSearchResult, ArchivedCase, ArchivedTodo } from '../../types';

interface ArchiveSearchProps {
  open: boolean;
  onClose: () => void;
  onItemSelect?: (item: ArchivedCase | ArchivedTodo) => void;
  onFiltersApply?: (filters: ArchiveFilters) => void;
  initialFilters?: ArchiveFilters;
}

const archiveReasons = [
  'MANUAL',
  'AUTO_TIME_BASED',
  'AUTO_INACTIVITY',
  'POLICY_COMPLIANCE',
  'BULK_OPERATION',
  'USER_REQUEST',
  'LEGAL_HOLD_EXPIRED',
  'OTHER'
];

const retentionStatuses = [
  'ACTIVE',
  'WARNING',
  'EXPIRED',
  'LEGAL_HOLD',
  'PENDING_DELETION'
];

const ArchiveSearch: React.FC<ArchiveSearchProps> = ({
  open,
  onClose,
  onItemSelect,
  onFiltersApply,
  initialFilters = {},
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [filters, setFilters] = useState<ArchiveFilters>(initialFilters);
  const [searchResults, setSearchResults] = useState<ArchiveSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadAvailableTags();
    }
  }, [open]);

  const loadAvailableTags = async () => {
    try {
      // En una implementación real, cargaríamos las etiquetas disponibles
      // const tags = await archiveService.getAvailableTags();
      // setAvailableTags(tags);
      
      // Por ahora usamos datos de ejemplo
      setAvailableTags(['urgente', 'cliente-importante', 'bug-critico', 'legal', 'temporal']);
    } catch (error) {
      console.error('Error al cargar etiquetas:', error);
    }
  };

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // En una implementación real, usaríamos el servicio de archivo
      // const results = await archiveService.searchArchived(searchFilters);
      // setSearchResults(results);

      // Por ahora simulamos resultados
      const mockResults: ArchiveSearchResult[] = [
        {
          id: '1',
          type: 'case',
          title: 'Caso de prueba #001',
          case_number: 'CASE-001',
          archived_at: new Date().toISOString(),
          archived_by: 'admin',
          archived_by_name: 'Administrador',
          rank: 0.95,
          highlight: 'Resultado que coincide con la búsqueda'
        },
        {
          id: '2',
          type: 'todo',
          title: 'TODO de ejemplo',
          archived_at: new Date().toISOString(),
          archived_by: 'user1',
          archived_by_name: 'Usuario Uno',
          rank: 0.85,
          highlight: 'Otro resultado relevante'
        }
      ];

      // Filtrar resultados según el query
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(filteredResults);

    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setError('Error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayedSearch = setTimeout(() => {
        performSearch();
      }, 500);

      return () => clearTimeout(delayedSearch);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, performSearch]);

  const handleFilterChange = (key: keyof ArchiveFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleApplyFilters = () => {
    const finalFilters: ArchiveFilters = {
      ...filters,
      searchQuery: searchQuery.trim() || undefined
    };

    onFiltersApply?.(finalFilters);
    onClose();
  };

  const handleItemClick = async (result: ArchiveSearchResult) => {
    try {
      // En una implementación real, cargaríamos el item completo
      // const item = result.type === 'case' 
      //   ? await archiveService.getArchivedCase(result.id)
      //   : await archiveService.getArchivedTodo(result.id);
      
      // Por ahora simulamos
      const mockItem = {
        id: result.id,
        // ... otros campos según el tipo
      };

      onItemSelect?.(mockItem as any);
      onClose();
    } catch (error) {
      console.error('Error al cargar item:', error);
      setError('Error al cargar el elemento seleccionado');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  }, [filters]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <SearchIcon sx={{ mr: 1 }} />
              Búsqueda Avanzada en Archivo
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {activeFiltersCount > 0 && (
                <Chip
                  size="small"
                  label={`${activeFiltersCount} filtros`}
                  color="primary"
                />
              )}
              <Button
                size="small"
                startIcon={<FilterIcon />}
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant={showAdvanced ? 'contained' : 'outlined'}
              >
                Filtros
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2}>
            {/* Campo de búsqueda principal */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Buscar en archivo"
                placeholder="Buscar por número de caso, título, descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => setSearchQuery('')}
                        startIcon={<ClearIcon />}
                      >
                        Limpiar
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Filtros avanzados */}
            {showAdvanced && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Filtros Avanzados
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Fechas */}
                      <Grid item xs={12} sm={6}>
                        <DatePicker
                          label="Archivado desde"
                          value={filters.startDate ? new Date(filters.startDate) : null}
                          onChange={(date) => 
                            handleFilterChange('startDate', date?.toISOString().split('T')[0])
                          }
                          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <DatePicker
                          label="Archivado hasta"
                          value={filters.endDate ? new Date(filters.endDate) : null}
                          onChange={(date) => 
                            handleFilterChange('endDate', date?.toISOString().split('T')[0])
                          }
                          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                      </Grid>

                      {/* Tipo de elemento */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={filters.itemType || ''}
                            onChange={(e) => handleFilterChange('itemType', e.target.value || undefined)}
                            label="Tipo"
                          >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="case">Casos</MenuItem>
                            <MenuItem value="todo">TODOs</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Razón de archivo */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Razón de Archivo</InputLabel>
                          <Select
                            value={filters.archiveReason || ''}
                            onChange={(e) => handleFilterChange('archiveReason', e.target.value || undefined)}
                            label="Razón de Archivo"
                          >
                            <MenuItem value="">Todas</MenuItem>
                            {archiveReasons.map(reason => (
                              <MenuItem key={reason} value={reason}>
                                {reason.replace(/_/g, ' ')}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Estado de retención */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Estado de Retención</InputLabel>
                          <Select
                            value={filters.retentionStatus || ''}
                            onChange={(e) => handleFilterChange('retentionStatus', e.target.value || undefined)}
                            label="Estado de Retención"
                          >
                            <MenuItem value="">Todos</MenuItem>
                            {retentionStatuses.map(status => (
                              <MenuItem key={status} value={status}>
                                {status.replace(/_/g, ' ')}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Etiquetas */}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          multiple
                          options={availableTags}
                          value={filters.tags || []}
                          onChange={(_, value) => handleFilterChange('tags', value)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Etiquetas"
                              size="small"
                              placeholder="Seleccionar etiquetas"
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                variant="outlined"
                                label={option}
                                size="small"
                                {...getTagProps({ index })}
                                key={option}
                              />
                            ))
                          }
                        />
                      </Grid>

                      {/* Retención legal */}
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.isLegalHold || false}
                              onChange={(e) => handleFilterChange('isLegalHold', e.target.checked || undefined)}
                            />
                          }
                          label="Solo elementos con retención legal"
                        />
                      </Grid>

                      {/* Botón para limpiar filtros */}
                      <Grid item xs={12}>
                        <Button
                          startIcon={<ClearIcon />}
                          onClick={handleClearFilters}
                          disabled={activeFiltersCount === 0}
                        >
                          Limpiar Filtros
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Resultados de búsqueda */}
            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : searchResults.length > 0 ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resultados ({searchResults.length})
                    </Typography>
                    
                    <List>
                      {searchResults.map((result, index) => (
                        <React.Fragment key={result.id}>
                          <ListItemButton onClick={() => handleItemClick(result)}>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle1">
                                    {result.type === 'case' ? result.case_number : result.title}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={result.type === 'case' ? 'Caso' : 'TODO'}
                                    color={result.type === 'case' ? 'primary' : 'secondary'}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box mt={1}>
                                  <Typography variant="body2" color="text.secondary">
                                    {result.title}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={2} mt={1}>
                                    <Typography variant="caption" color="text.secondary">
                                      <DateIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                      Archivado: {formatDate(result.archived_at)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                      Por: {result.archived_by_name || result.archived_by}
                                    </Typography>
                                  </Box>
                                  {result.highlight && (
                                    <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
                                      {result.highlight}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItemButton>
                          {index < searchResults.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ) : searchQuery.trim() && !loading ? (
                <Alert severity="info">
                  No se encontraron resultados para "{searchQuery}"
                </Alert>
              ) : null}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApplyFilters}
            variant="contained"
            disabled={!searchQuery.trim() && activeFiltersCount === 0}
          >
            Aplicar Filtros
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ArchiveSearch;
