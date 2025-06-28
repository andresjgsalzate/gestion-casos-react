import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Work as CaseIcon,
  Assignment as TodoIcon,
  Timer as TimerIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import { caseService, todoService, timeService, applicationService, userService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import DataVisibilityInfo from '../components/Common/DataVisibilityInfo';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalTodos: number;
  completedTodos: number;
  totalTimeSpentCases: number;
  totalTimeSpentTodos: number;
  casesByApplication: { [key: string]: number };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    totalTodos: 0,
    completedTodos: 0,
    totalTimeSpentCases: 0,
    totalTimeSpentTodos: 0,
    casesByApplication: {},
  });
  const [loading, setLoading] = useState(true);
  const [casesByStatus, setCasesByStatus] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<{
    created: number[];
    completed: number[];
  }>({
    created: [0, 0, 0, 0, 0, 0, 0],
    completed: [0, 0, 0, 0, 0, 0, 0]
  });

  // Nuevos estados para gráficos de administrador
  const [casesByUser, setCasesByUser] = useState<{ [key: string]: number }>({});
  const [timeByUser, setTimeByUser] = useState<{ [key: string]: number }>({});

  const { user } = useAuthStore();
  const { isAdmin } = usePermissions();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar casos y TODOs con aislamiento de datos
      const [cases, todos, applications] = await Promise.all([
        caseService.getAll(user?.id, isAdmin),
        todoService.getAll(user?.id, isAdmin),
        applicationService.getAll()
      ]);

      // Si es administrador, cargar datos adicionales para gráficos por usuario
      let users: any[] = [];
      let userCasesMap: { [key: string]: number } = {};
      let userTimeMap: { [key: string]: number } = {};

      if (isAdmin) {
        try {
          users = await userService.getAll();
          
          // Cargar todos los casos sin filtro de usuario para obtener estadísticas completas
          const allCases = await caseService.getAll();
          const allTodos = await todoService.getAll();
          
          // Agrupar casos por usuario
          userCasesMap = allCases.reduce((acc: any, caso: any) => {
            const user = users.find(u => u.id === caso.user_id);
            const userName = user ? user.name : 'Usuario Desconocido';
            acc[userName] = (acc[userName] || 0) + 1;
            return acc;
          }, {});

          // Calcular tiempo total por usuario
          for (const user of users) {
            let totalUserTime = 0;
            
            // Tiempo de casos del usuario
            const userCases = allCases.filter((c: any) => c.user_id === user.id);
            for (const caso of userCases) {
              try {
                const timeEntries = await timeService.getTimeEntriesByCase(caso.id);
                totalUserTime += timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
              } catch (e) {
                console.warn(`Error loading time for case ${caso.id}:`, e);
              }
            }

            // Tiempo de TODOs del usuario
            const userTodos = allTodos.filter((t: any) => t.created_by === user.id);
            for (const todo of userTodos) {
              try {
                const timeEntries = await timeService.getTimeTrackingByTodo(todo.id);
                totalUserTime += timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
              } catch (e) {
                console.warn(`Error loading time for todo ${todo.id}:`, e);
              }
            }

            if (totalUserTime > 0) {
              userTimeMap[user.name] = totalUserTime;
            }
          }

          setCasesByUser(userCasesMap);
          setTimeByUser(userTimeMap);
        } catch (adminError) {
          console.warn('Error loading admin data:', adminError);
        }
      }
      
      // Calcular estadísticas
      const totalCases = cases.length;
      const activeCases = cases.filter((c: any) => c.status === 'EN CURSO').length;
      const completedCases = cases.filter((c: any) => c.status === 'TERMINADA').length;
      const totalTodos = todos.length;
      const completedTodos = todos.filter((t: any) => t.status === 'COMPLETED').length;

      // Agrupar casos por estado
      const statusGroups = cases.reduce((acc: any, caso: any) => {
        acc[caso.status] = (acc[caso.status] || 0) + 1;
        return acc;
      }, {});

      // Agrupar casos por aplicación
      const appGroups = cases.reduce((acc: any, caso: any) => {
        const app = applications.find((a: any) => a.id === caso.application_id);
        const appName = app?.name || 'Sin Aplicación';
        acc[appName] = (acc[appName] || 0) + 1;
        return acc;
      }, {});

      // Calcular actividad semanal real
      const weeklyCreated = [0, 0, 0, 0, 0, 0, 0];
      const weeklyCompleted = [0, 0, 0, 0, 0, 0, 0];
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Lunes
      
      cases.forEach((caso: any) => {
        const caseDate = new Date(caso.created_at);
        const daysDiff = Math.floor((caseDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 0 && daysDiff < 7) {
          weeklyCreated[daysDiff]++;
          
          if (caso.status === 'TERMINADA' && caso.updated_at) {
            const completedDate = new Date(caso.updated_at);
            const completedDaysDiff = Math.floor((completedDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
            if (completedDaysDiff >= 0 && completedDaysDiff < 7) {
              weeklyCompleted[completedDaysDiff]++;
            }
          }
        }
      });

      setWeeklyActivity({
        created: weeklyCreated,
        completed: weeklyCompleted
      });

      // Calcular tiempos totales
      let totalTimeSpentCases = 0;
      let totalTimeSpentTodos = 0;

      try {
        // Obtener tiempo total de casos
        for (const caso of cases) {
          const timeEntries = await timeService.getTimeEntriesByCase(caso.id);
          totalTimeSpentCases += timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
        }

        // Obtener tiempo total de TODOs
        for (const todo of todos) {
          const timeEntries = await timeService.getTimeTrackingByTodo(todo.id);
          totalTimeSpentTodos += timeEntries.reduce((total, entry) => total + (entry.duration_seconds || 0), 0);
        }
      } catch (timeError) {
        console.warn('Error loading time data:', timeError);
      }

      setStats({
        totalCases,
        activeCases,
        completedCases,
        totalTodos,
        completedTodos,
        totalTimeSpentCases,
        totalTimeSpentTodos,
        casesByApplication: appGroups,
      });

      setCasesByStatus(statusGroups);
      setRecentActivity(cases.slice(0, 5)); // Últimos 5 casos

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Configuración del gráfico de líneas (actividad semanal)
  const lineChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Casos Creados',
        data: weeklyActivity.created,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Casos Completados',
        data: weeklyActivity.completed,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // Configuración del gráfico de barras (casos por aplicación)
  const barChartData = {
    labels: Object.keys(stats.casesByApplication),
    datasets: [
      {
        label: 'Casos',
        data: Object.values(stats.casesByApplication),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

  // Configuración del gráfico de dona (distribución por estado)
  const doughnutData = {
    labels: Object.keys(casesByStatus),
    datasets: [
      {
        data: Object.values(casesByStatus),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  // Configuración del gráfico de casos por usuario (solo para administradores)
  const casesByUserData = {
    labels: Object.keys(casesByUser),
    datasets: [
      {
        label: 'Cantidad de Casos',
        data: Object.values(casesByUser),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
        ],
      },
    ],
  };

  // Configuración del gráfico de tiempo por usuario (solo para administradores)
  const timeByUserData = {
    labels: Object.keys(timeByUser),
    datasets: [
      {
        label: 'Tiempo Total (horas)',
        data: Object.values(timeByUser).map(seconds => Math.round(seconds / 3600 * 100) / 100),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido de vuelta, {user?.name}
      </Typography>

      <DataVisibilityInfo />

      {/* Tarjetas de métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CaseIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Casos
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalCases}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TodoIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    TODOs Activos
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalTodos - stats.completedTodos}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimerIcon color="info" sx={{ fontSize: 30, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom fontSize="0.8rem">
                    Tiempo Casos
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(stats.totalTimeSpentCases)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimerIcon color="warning" sx={{ fontSize: 30, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom fontSize="0.8rem">
                    Tiempo TODOs
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(stats.totalTimeSpentTodos)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimerIcon color="primary" sx={{ fontSize: 30, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom fontSize="0.8rem">
                    Tiempo Total
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(stats.totalTimeSpentCases + stats.totalTimeSpentTodos)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Eficiencia
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalCases > 0 ? Math.round((stats.completedCases / stats.totalCases) * 100) : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividad Semanal
            </Typography>
            <Line data={lineChartData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estados de Casos
            </Typography>
            <Doughnut data={doughnutData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Casos por Aplicación
            </Typography>
            <Bar data={barChartData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividad Reciente
            </Typography>
            <Box>
              {recentActivity.map((activity, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle2">
                    {activity.case_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activity.status} - {new Date(activity.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Gráficos adicionales para administradores */}
        {isAdmin && (
          <>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Casos por Usuario
                </Typography>
                {Object.keys(casesByUser).length > 0 ? (
                  <Bar data={casesByUserData} options={chartOptions} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de casos por usuario disponibles
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tiempo Total por Usuario
                </Typography>
                {Object.keys(timeByUser).length > 0 ? (
                  <Bar data={timeByUserData} options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Horas'
                        }
                      }
                    }
                  }} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de tiempo por usuario disponibles
                  </Typography>
                )}
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
