import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface LoadingProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

interface SkeletonContentProps {
  type: 'table' | 'cards' | 'dashboard' | 'form' | 'chart';
  rows?: number;
  columns?: number;
}

const Loading: React.FC<LoadingProps> = ({
  message = 'Cargando...',
  variant = 'spinner',
  size = 'medium',
  overlay = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 80;
      default:
        return 60;
    }
  };

  const getMinHeight = () => {
    if (overlay) return '100%';
    switch (size) {
      case 'small':
        return '200px';
      case 'large':
        return '100vh';
      default:
        return '300px';
    }
  };

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  const containerSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getMinHeight(),
    gap: 2,
    p: 3,
    ...(overlay && {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999,
    }),
  };

  return (
    <Box sx={containerSx}>
      <CircularProgress size={getSize()} />
      <Typography
        variant={isMobile ? 'body1' : 'h6'}
        color="text.secondary"
        textAlign="center"
      >
        {message}
      </Typography>
    </Box>
  );
};

export const SkeletonContent: React.FC<SkeletonContentProps> = ({
  type,
  rows = 5,
  columns = 4,
}) => {
  switch (type) {
    case 'table':
      return (
        <Paper>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              {Array.from({ length: columns }).map((_, index) => (
                <Grid item xs={12 / columns} key={index}>
                  <Skeleton variant="text" height={24} />
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Grid container spacing={2}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Grid item xs={12 / columns} key={colIndex}>
                    <Skeleton variant="text" height={20} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Paper>
      );

    case 'cards':
      return (
        <Grid container spacing={3}>
          {Array.from({ length: rows }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rounded" width={80} height={32} />
                    <Skeleton variant="rounded" width={60} height={32} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );

    case 'dashboard':
      return (
        <Box>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" height={20} width="60%" />
                        <Skeleton variant="text" height={32} width="40%" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="text" height={28} width="30%" sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={300} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="text" height={28} width="50%" sx={{ mb: 2 }} />
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );

    case 'form':
      return (
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" height={32} width="40%" sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            {Array.from({ length: rows }).map((_, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Skeleton variant="text" height={20} width="30%" />
                <Skeleton variant="rectangular" height={56} sx={{ mt: 1 }} />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Box>
        </Paper>
      );

    case 'chart':
      return (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="text" height={28} width="30%" />
            <Skeleton variant="rounded" width={120} height={32} />
          </Box>
          
          <Skeleton variant="rectangular" height={400} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="text" width={60} height={16} />
              </Box>
            ))}
          </Box>
        </Paper>
      );

    default:
      return (
        <Box>
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} variant="text" height={40} sx={{ mb: 1 }} />
          ))}
        </Box>
      );
  }
};

// Componente para loading con progreso
export const LoadingWithProgress: React.FC<{
  progress: number;
  message?: string;
  subMessage?: string;
}> = ({ progress, message = 'Cargando...', subMessage }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    p: 4,
  }}>
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={progress}
        size={80}
        thickness={4}
      />
      <Box sx={{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography variant="h6" component="div" color="text.secondary">
          {`${Math.round(progress)}%`}
        </Typography>
      </Box>
    </Box>
    
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" color="text.primary">
        {message}
      </Typography>
      {subMessage && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {subMessage}
        </Typography>
      )}
    </Box>
  </Box>
);

// Hook para simular progreso
export const useLoadingProgress = (duration: number = 3000) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + (100 / (duration / 100));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [duration]);

  return progress;
};

export default Loading;
