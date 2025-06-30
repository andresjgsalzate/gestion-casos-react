import React, { useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  NewReleases as FeatureIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { getVersionInfo } from '../../config/version';

interface VersionDisplayProps {
  showAsChip?: boolean;
  showBuildInfo?: boolean;
}

const VersionDisplay: React.FC<VersionDisplayProps> = ({ 
  showAsChip = true, 
  showBuildInfo = false 
}) => {
  const [open, setOpen] = useState(false);
  const versionInfo = getVersionInfo();

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <FeatureIcon color="primary" />;
      case 'feature':
        return <UpdateIcon color="success" />;
      case 'improvement':
        return <InfoIcon color="info" />;
      case 'bugfix':
        return <BugIcon color="warning" />;
      default:
        return <InfoIcon />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'primary';
      case 'feature':
        return 'success';
      case 'improvement':
        return 'info';
      case 'bugfix':
        return 'warning';
      default:
        return 'default';
    }
  };

  const VersionChip = () => (
    <Tooltip title="Ver información de versión">
      <Chip
        icon={<InfoIcon />}
        label={`v${versionInfo.version}`}
        size="small"
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      />
    </Tooltip>
  );

  const VersionText = () => (
    <Box display="flex" alignItems="center" gap={1}>
      <IconButton size="small" onClick={() => setOpen(true)}>
        <InfoIcon fontSize="small" />
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {versionInfo.displayVersion}
      </Typography>
      {showBuildInfo && (
        <Typography variant="caption" color="text.secondary">
          ({versionInfo.buildInfo})
        </Typography>
      )}
    </Box>
  );

  return (
    <>
      {showAsChip ? <VersionChip /> : <VersionText />}
      
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <InfoIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Sistema de Gestión de Casos
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {versionInfo.displayVersion}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Información de la Versión
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Versión:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {versionInfo.fullVersion}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nombre Código:
                </Typography>
                <Typography variant="body1">
                  {versionInfo.codename}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Fecha de Release:
                </Typography>
                <Typography variant="body1">
                  {new Date(versionInfo.releaseDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Entorno:
                </Typography>
                <Chip 
                  label={versionInfo.environment}
                  size="small"
                  color={versionInfo.environment === 'production' ? 'success' : 'warning'}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Historial de Cambios
          </Typography>
          
          {versionInfo.changelog.map((release, index) => (
            <Accordion key={release.version} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {getChangeTypeIcon(release.type)}
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      v{release.version} - {release.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(release.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip 
                    label={release.type} 
                    size="small" 
                    color={getChangeTypeColor(release.type) as any}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {release.changes.map((change, changeIndex) => (
                    <ListItem key={changeIndex}>
                      <ListItemText 
                        primary={change}
                        sx={{ 
                          '& .MuiListItemText-primary': {
                            fontSize: '0.9rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VersionDisplay;
