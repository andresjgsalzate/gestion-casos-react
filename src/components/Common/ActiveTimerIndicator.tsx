import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';

interface ActiveTimerIndicatorProps {
  timerRunning: boolean;
  timerSeconds: number;
  activeTimersCount: number;
  onStopTimer: () => void;
}

const ActiveTimerIndicator: React.FC<ActiveTimerIndicatorProps> = ({
  timerRunning,
  timerSeconds,
  activeTimersCount,
  onStopTimer,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!timerRunning && activeTimersCount === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
      {timerRunning && (
        <Chip
          icon={<TimerIcon sx={{ animation: 'pulse 1s infinite' }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" component="span">
                {formatTime(timerSeconds)}
              </Typography>
              <Tooltip title="Detener timer">
                <IconButton size="small" onClick={onStopTimer} sx={{ p: 0.5 }}>
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          color="primary"
          variant="filled"
          sx={{
            '& .MuiChip-icon': {
              color: 'white',
            },
            '& .MuiChip-label': {
              color: 'white',
            },
          }}
        />
      )}
      
      {activeTimersCount > 0 && !timerRunning && (
        <Chip
          icon={<PlayIcon />}
          label={`${activeTimersCount} timer(s) activo(s)`}
          color="warning"
          variant="outlined"
          size="small"
        />
      )}
    </Box>
  );
};

export default ActiveTimerIndicator;
