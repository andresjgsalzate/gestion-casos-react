import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En producción, enviar error a servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Aquí se podría integrar con servicios como Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Ejemplo de envío a API de logging
    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    }).catch(err => {
      console.error('Error al enviar log:', err);
    });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorToClipboard = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `;

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error copiado al portapapeles');
    }).catch(() => {
      alert('No se pudo copiar el error');
    });
  };

  public render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            backgroundColor: '#f5f5f5',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h4" gutterBottom color="error">
              ¡Oops! Algo salió mal
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Se ha producido un error inesperado en la aplicación. 
              Nuestro equipo ha sido notificado automáticamente.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Error Técnico</AlertTitle>
              {error?.message || 'Error desconocido'}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Intentar de nuevo
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReload}
                color="secondary"
              >
                Recargar página
              </Button>
            </Box>

            {/* Detalles técnicos expandibles */}
            <Accordion sx={{ textAlign: 'left' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugIcon fontSize="small" />
                  <Typography>Detalles técnicos</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Error:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      backgroundColor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      fontSize: '0.8rem',
                      overflow: 'auto',
                      maxHeight: 200,
                      mb: 2,
                    }}
                  >
                    {error?.stack || error?.message}
                  </Typography>

                  {errorInfo && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Component Stack:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          backgroundColor: '#f5f5f5',
                          p: 2,
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          overflow: 'auto',
                          maxHeight: 200,
                          mb: 2,
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    onClick={this.copyErrorToClipboard}
                    sx={{ mt: 1 }}
                  >
                    Copiar error
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Si el problema persiste, contacta al soporte técnico.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook para usar en componentes funcionales
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Error manejado:', error);
    
    // En desarrollo, mostrar el error
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    
    // En producción, loggear y mostrar mensaje amigable
    // Aquí se podría integrar con un servicio de notificaciones
  };

  return { handleError };
};

// Componente simple para errores específicos
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
  message?: string;
}> = ({ error, resetError, message }) => (
  <Alert
    severity="error"
    action={
      resetError && (
        <Button color="inherit" size="small" onClick={resetError}>
          Reintentar
        </Button>
      )
    }
  >
    <AlertTitle>Error</AlertTitle>
    {message || error?.message || 'Ha ocurrido un error inesperado'}
  </Alert>
);

export default ErrorBoundary;
