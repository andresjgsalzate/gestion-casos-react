import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const submissionCount = React.useRef(0);
  
  const { login, user } = useAuthStore();
  const navigate = useNavigate();

  // Manejar redirection cuando el usuario está autenticado
  useEffect(() => {
    if (user && !loading && !isSubmitting && !hasNavigated) {
      setHasNavigated(true);
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, isSubmitting, hasNavigated, navigate]);

  // No renderizar el formulario si el usuario ya está autenticado
  if (user && !loading && !isSubmitting) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submissions
    if (isSubmitting || loading) {
      return;
    }

    // Validaciones en el frontend
    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    submissionCount.current++;
    setIsSubmitting(true);
    setLoading(true);
    setError(''); // Limpiar error anterior solo cuando se inicia un nuevo intento

    try {
      await login(email.trim().toLowerCase(), password);
      // La navegación se maneja en el useEffect
    } catch (err: any) {
      let errorMessage = '';
      
      // Manejar diferentes tipos de errores
      if (err.message?.includes('Email y contraseña son requeridos')) {
        errorMessage = 'Por favor completa todos los campos';
      } else if (err.message?.includes('email válido')) {
        errorMessage = 'Por favor ingresa un email válido';
      } else if (err.message?.includes('contraseña debe tener')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (err.message?.includes('Email o contraseña incorrectos')) {
        errorMessage = 'Email o contraseña incorrectos. Por favor verifica tus credenciales e intenta nuevamente.';
      } else if (err.message?.includes('cuenta está desactivada')) {
        errorMessage = 'Tu cuenta está desactivada. Contacta al administrador para activarla.';
      } else if (err.message?.includes('Error de configuración del sistema')) {
        errorMessage = 'Error de configuración del sistema. Contacta al administrador.';
      } else if (err.message?.includes('Error en los datos del usuario')) {
        errorMessage = 'Hay un problema con tu cuenta. Contacta al administrador.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Error de conexión. Por favor verifica tu conexión a internet e intenta nuevamente.';
      } else {
        errorMessage = 'Error al iniciar sesión. Por favor intenta nuevamente.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Card elevation={10} sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: '50%',
                  p: 2,
                  mb: 2,
                }}
              >
                <LockIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Casos
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Ingresa tus credenciales para acceder al sistema
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.95rem',
                    fontWeight: 500
                  },
                  '& .MuiAlert-icon': {
                    fontSize: '1.2rem'
                  }
                }}
                variant="filled"
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Solo limpiar errores de validación del frontend
                  if (error && (
                    error.includes('email es requerido') || 
                    error.includes('email válido') ||
                    error.includes('completa todos los campos')
                  )) {
                    setError('');
                  }
                }}
                disabled={loading || isSubmitting}
                error={!!error && error.includes('email')}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Solo limpiar errores de validación del frontend
                  if (error && (
                    error.includes('contraseña es requerida') || 
                    error.includes('contraseña debe tener') ||
                    error.includes('completa todos los campos')
                  )) {
                    setError('');
                  }
                }}
                disabled={loading || isSubmitting}
                error={!!error && error.includes('contraseña')}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
