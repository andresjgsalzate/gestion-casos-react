import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/darkMode.css';

import { useAuthStore } from './store/authStore';
import { useSessionManager } from './hooks/useSessionManager';
import { ThemeContextProvider, useThemeContext } from './contexts/ThemeContext';
import Login from './components/Auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CaseManagement from './pages/CaseManagement';
import CaseClassification from './pages/CaseClassification';
import TodoManagement from './pages/TodoManagement';
import Reports from './pages/Reports';
import Administration from './pages/Administration';
import Profile from './pages/Profile';
import Loading from './components/Common/Loading';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para redirigir usuarios autenticados desde login
const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Función para crear tema basado en el modo
const createAppTheme = (isDarkMode: boolean) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: isDarkMode ? '#121212' : '#f5f5f5',
      paper: isDarkMode ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? '#1976d2' : '#1976d2',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDarkMode ? '#2e2e2e' : '#fafafa',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? '#2e2e2e' : '#fafafa',
          '& .MuiTableCell-head': {
            color: isDarkMode ? '#ffffff' : '#000000',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-body': {
            color: isDarkMode ? '#ffffff' : '#000000',
            borderBottom: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
          },
          '& .MuiTableRow-root': {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            '&:hover': {
              backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
            },
          },
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <AppContent />
    </ThemeContextProvider>
  );
};

const AppContent: React.FC = () => {
  const { initialize, loading } = useAuthStore();
  const { isDarkMode } = useThemeContext();
  
  // Inicializar el gestor de sesión para manejar el cierre automático y guardado de timers
  useSessionManager();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // Actualizar atributo data-theme del documento
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const theme = createAppTheme(isDarkMode);

  if (loading) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              } 
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/cases" element={<CaseManagement />} />
                      <Route path="/classification" element={<CaseClassification />} />
                      <Route path="/todos" element={<TodoManagement />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/admin/*" element={<Administration />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
