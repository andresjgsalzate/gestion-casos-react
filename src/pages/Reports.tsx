import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { DataGrid } from '@mui/x-data-grid';
import { Bar, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

import { 
  reportService, 
  caseService, 
  todoService, 
  userService,
  applicationService 
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import DataVisibilityInfo from '../components/Common/DataVisibilityInfo';

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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
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

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const [cases, setCases] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedApplication, setSelectedApplication] = useState('');

  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();

  const loadReportData = useCallback(async () => {
    try {
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      
      // Si es admin y hay un usuario seleccionado, usar ese usuario
      // Si no es admin, usar siempre el usuario actual
      const filterUserId = isAdmin ? (selectedUser || undefined) : user?.id;
      
      const timeReport = await reportService.getTimeReport(start, end, filterUserId, isAdmin);
      setTimeEntries([...timeReport.time_entries, ...timeReport.time_tracking]);
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  }, [startDate, endDate, selectedUser, user?.id, isAdmin]);

  const loadData = useCallback(async () => {
    try {
      // Si es admin y hay un usuario seleccionado, usar ese usuario
      // Si no es admin, usar siempre el usuario actual
      const filterUserId = isAdmin ? (selectedUser || undefined) : user?.id;
      
      const [casesData, todosData] = await Promise.all([
        caseService.getAll(filterUserId, isAdmin),
        todoService.getAll(filterUserId, isAdmin),
      ]);
      setCases(casesData);
      setTodos(todosData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [selectedUser, user?.id, isAdmin]);

  const loadUsers = useCallback(async () => {
    try {
      // Solo cargar usuarios si es admin
      if (isAdmin) {
        const usersData = await userService.getAll();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [isAdmin]);

  const loadApplications = useCallback(async () => {
    try {
      const appsData = await applicationService.getAll();
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadUsers();
    loadApplications();
  }, [loadData, loadUsers, loadApplications]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [startDate, endDate, selectedUser, selectedApplication, loadReportData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar el reporte');
      console.error(error);
    }
  };

  const exportCasesReport = () => {
    const filteredCases = cases.filter(caso => {
      const caseDate = dayjs(caso.created_at);
      return caseDate.isAfter(startDate) && caseDate.isBefore(endDate);
    });

    const reportData = filteredCases.map(caso => ({
      'Número de Caso': caso.case_number,
      'Descripción': caso.description,
      'Estado': caso.status,
      'Complejidad': caso.complexity,
      'Aplicación': caso.application_name,
      'Origen': caso.origin_name,
      'Prioridad': caso.priority_name,
      'Asignado a': caso.user_name,
      'Clasificación': caso.classification,
      'Puntuación': caso.classification_score,
      'Fecha Creación': dayjs(caso.created_at).format('DD/MM/YYYY'),
      'Fecha Completado': caso.completed_at ? dayjs(caso.completed_at).format('DD/MM/YYYY') : '',
    }));

    exportToExcel(reportData, 'reporte_casos', 'Casos');
  };

  const exportTodosReport = () => {
    const filteredTodos = todos.filter(todo => {
      const todoDate = dayjs(todo.created_at);
      return todoDate.isAfter(startDate) && todoDate.isBefore(endDate);
    });

    const reportData = filteredTodos.map(todo => ({
      'Título': todo.title,
      'Descripción': todo.description,
      'Estado': todo.status,
      'Prioridad': todo.priority_name,
      'Asignado a': todo.assigned_to_name,
      'Creado por': todo.created_by_name,
      'Caso Relacionado': todo.case_number,
      'Fecha Límite': todo.due_date ? dayjs(todo.due_date).format('DD/MM/YYYY') : '',
      'Fecha Creación': dayjs(todo.created_at).format('DD/MM/YYYY'),
      'Fecha Completado': todo.completed_at ? dayjs(todo.completed_at).format('DD/MM/YYYY') : '',
    }));

    exportToExcel(reportData, 'reporte_todos', 'TODOs');
  };

  const exportTimeReport = () => {
    const reportData = timeEntries.map(entry => ({
      'Tipo': entry.case_id ? 'Caso' : 'TODO',
      'Referencia': entry.cases?.case_number || entry.todos?.title || '',
      'Usuario': entry.users?.name || '',
      'Inicio': dayjs(entry.start_time).format('DD/MM/YYYY HH:mm'),
      'Fin': entry.end_time ? dayjs(entry.end_time).format('DD/MM/YYYY HH:mm') : '',
      'Duración (minutos)': Math.round(entry.duration_seconds / 60),
      'Descripción': entry.description || '',
    }));

    exportToExcel(reportData, 'reporte_tiempo', 'Tiempo');
  };

  // Datos para gráficos
  const casesChartData = {
    labels: ['Pendientes', 'En Curso', 'Terminados', 'Escalados'],
    datasets: [
      {
        label: 'Casos',
        data: [
          cases.filter(c => c.status === 'PENDIENTE').length,
          cases.filter(c => c.status === 'EN CURSO').length,
          cases.filter(c => c.status === 'TERMINADA').length,
          cases.filter(c => c.status === 'ESCALADA').length,
        ],
        backgroundColor: ['#FF9800', '#2196F3', '#4CAF50', '#F44336'],
      },
    ],
  };

  const complexityChartData = {
    labels: ['Baja', 'Media', 'Alta'],
    datasets: [
      {
        label: 'Complejidad',
        data: [
          cases.filter(c => c.complexity === 'BAJO').length,
          cases.filter(c => c.complexity === 'MEDIO').length,
          cases.filter(c => c.complexity === 'ALTO').length,
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
      },
    ],
  };

  const applicationChartData = {
    labels: applications.map(app => app.name),
    datasets: [
      {
        label: 'Casos por Aplicación',
        data: applications.map(app => 
          cases.filter(c => c.application_id === app.id).length
        ),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Gráficos adicionales para administradores
  const userCasesChartData = isAdmin ? {
    labels: users.map(user => user.name),
    datasets: [
      {
        label: 'Casos Totales',
        data: users.map(user => 
          cases.filter(c => c.user_id === user.id).length
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
      {
        label: 'Casos Completados',
        data: users.map(user => 
          cases.filter(c => c.user_id === user.id && c.status === 'TERMINADA').length
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
      },
    ],
  } : null;

  const userProductivityChartData = isAdmin ? {
    labels: users.map(user => user.name),
    datasets: [
      {
        label: 'Tasa de Completitud (%)',
        data: users.map(user => {
          const userCases = cases.filter(c => c.user_id === user.id);
          const completedCases = userCases.filter(c => c.status === 'TERMINADA');
          return userCases.length > 0 ? Math.round((completedCases.length / userCases.length) * 100) : 0;
        }),
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
      },
    ],
  } : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Reportes y Análisis
        </Typography>

        <DataVisibilityInfo />

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Fecha Inicio"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Fecha Fin"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            {isAdmin && (
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Aplicación</InputLabel>
                <Select
                  value={selectedApplication}
                  onChange={(e) => setSelectedApplication(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {applications.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Estadísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ReportIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Casos
                    </Typography>
                    <Typography variant="h4">
                      {cases.length}
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
                  <TrendIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Casos Completados
                    </Typography>
                    <Typography variant="h4">
                      {cases.filter(c => c.status === 'TERMINADA').length}
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
                  <TimelineIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      TODOs Pendientes
                    </Typography>
                    <Typography variant="h4">
                      {todos.filter(t => t.status === 'PENDING').length}
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
                  <ReportIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Eficiencia
                    </Typography>
                    <Typography variant="h4">
                      {cases.length > 0 ? Math.round((cases.filter(c => c.status === 'TERMINADA').length / cases.length) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs para diferentes reportes */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Casos" />
              <Tab label="TODOs" />
              <Tab label="Tiempo" />
              <Tab label="Análisis" />
              {isAdmin && <Tab label="Por Usuario" />}
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Reporte de Casos</Typography>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={exportCasesReport}
              >
                Exportar a Excel
              </Button>
            </Box>
            <DataGrid
              rows={cases}
              columns={[
                { field: 'case_number', headerName: 'Número', width: 120 },
                { field: 'description', headerName: 'Descripción', width: 250, flex: 1 },
                { field: 'status', headerName: 'Estado', width: 120 },
                { field: 'complexity', headerName: 'Complejidad', width: 120 },
                { field: 'application_name', headerName: 'Aplicación', width: 130 },
                { field: 'user_name', headerName: 'Asignado', width: 150 },
                { 
                  field: 'created_at', 
                  headerName: 'Creado', 
                  width: 120,
                  valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY')
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Reporte de TODOs</Typography>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={exportTodosReport}
              >
                Exportar a Excel
              </Button>
            </Box>
            <DataGrid
              rows={todos}
              columns={[
                { field: 'title', headerName: 'Título', width: 200, flex: 1 },
                { field: 'status', headerName: 'Estado', width: 120 },
                { field: 'priority_name', headerName: 'Prioridad', width: 120 },
                { field: 'assigned_to_name', headerName: 'Asignado', width: 150 },
                { field: 'case_number', headerName: 'Caso', width: 120 },
                { 
                  field: 'created_at', 
                  headerName: 'Creado', 
                  width: 120,
                  valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY')
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Reporte de Tiempo</Typography>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={exportTimeReport}
              >
                Exportar a Excel
              </Button>
            </Box>
            <DataGrid
              rows={timeEntries}
              columns={[
                { 
                  field: 'type', 
                  headerName: 'Tipo', 
                  width: 100,
                  valueGetter: (params) => params.row.case_id ? 'Caso' : 'TODO'
                },
                { 
                  field: 'reference', 
                  headerName: 'Referencia', 
                  width: 200,
                  valueGetter: (params) => params.row.cases?.case_number || params.row.todos?.title || ''
                },
                { 
                  field: 'user_name', 
                  headerName: 'Usuario', 
                  width: 150,
                  valueGetter: (params) => params.row.users?.name || ''
                },
                { 
                  field: 'start_time', 
                  headerName: 'Inicio', 
                  width: 150,
                  valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm')
                },
                { 
                  field: 'duration_minutes', 
                  headerName: 'Duración (min)', 
                  width: 120,
                  valueGetter: (params) => Math.round(params.row.duration_seconds / 60)
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Análisis Gráfico
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Estados de Casos
                  </Typography>
                  <Pie data={casesChartData} options={chartOptions} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Complejidad de Casos
                  </Typography>
                  <Pie data={complexityChartData} options={chartOptions} />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Casos por Aplicación
                  </Typography>
                  <Bar data={applicationChartData} options={chartOptions} />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Pestaña de reportes por usuario (solo para administradores) */}
          {isAdmin && (
            <TabPanel value={tabValue} index={4}>
              <Typography variant="h6" gutterBottom>
                Reportes por Usuario (Solo Administradores)
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Casos por Usuario
                    </Typography>
                    {userCasesChartData && users.length > 0 ? (
                      <Bar data={userCasesChartData} options={chartOptions} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay datos suficientes para mostrar este gráfico
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Tasa de Completitud por Usuario
                    </Typography>
                    {userProductivityChartData && users.length > 0 ? (
                      <Bar data={userProductivityChartData} options={{
                        ...chartOptions,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Porcentaje (%)'
                            }
                          }
                        }
                      }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay datos suficientes para mostrar este gráfico
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                {/* Tabla resumen por usuario */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Resumen por Usuario
                    </Typography>
                    <DataGrid
                      rows={users.map(user => {
                        const userCases = cases.filter(c => c.user_id === user.id);
                        const userTodos = todos.filter(t => t.created_by === user.id);
                        const completedCases = userCases.filter(c => c.status === 'TERMINADA').length;
                        const completedTodos = userTodos.filter(t => t.status === 'COMPLETED').length;
                        
                        return {
                          id: user.id,
                          userName: user.name,
                          totalCases: userCases.length,
                          completedCases,
                          pendingCases: userCases.filter(c => c.status === 'PENDIENTE').length,
                          inProgressCases: userCases.filter(c => c.status === 'EN CURSO').length,
                          totalTodos: userTodos.length,
                          completedTodos,
                          completionRate: userCases.length > 0 ? Math.round((completedCases / userCases.length) * 100) : 0
                        };
                      })}
                      columns={[
                        { field: 'userName', headerName: 'Usuario', width: 150 },
                        { field: 'totalCases', headerName: 'Total Casos', width: 120, type: 'number' },
                        { field: 'completedCases', headerName: 'Completados', width: 120, type: 'number' },
                        { field: 'pendingCases', headerName: 'Pendientes', width: 120, type: 'number' },
                        { field: 'inProgressCases', headerName: 'En Curso', width: 120, type: 'number' },
                        { field: 'totalTodos', headerName: 'Total TODOs', width: 120, type: 'number' },
                        { field: 'completedTodos', headerName: 'TODOs Completados', width: 150, type: 'number' },
                        { 
                          field: 'completionRate', 
                          headerName: 'Tasa Completitud (%)', 
                          width: 150, 
                          type: 'number',
                          renderCell: (params) => `${params.value}%`
                        },
                      ]}
                      autoHeight
                      hideFooter
                    />
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
