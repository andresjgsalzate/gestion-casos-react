import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Archive as ArchiveIcon,
  Info as InfoIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ArchivedCase, ArchivedTodo } from '../../types';

interface ArchivedItemViewerProps {
  open: boolean;
  onClose: () => void;
  item: ArchivedCase | ArchivedTodo | null;
  onRestore?: (item: ArchivedCase | ArchivedTodo) => void;
  onDelete?: (item: ArchivedCase | ArchivedTodo) => void;
  canRestore?: boolean;
  canDelete?: boolean;
}

const ArchivedItemViewer: React.FC<ArchivedItemViewerProps> = ({
  open,
  onClose,
  item,
  onRestore,
  onDelete,
  canRestore = false,
  canDelete = false,
}) => {
  if (!item) return null;

  const isCase = 'case_number' in item;
  
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRetentionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'EXPIRED':
        return 'error';
      case 'LEGAL_HOLD':
        return 'info';
      case 'PENDING_DELETION':
        return 'error';
      default:
        return 'default';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'ALTO':
        return 'error';
      case 'MEDIO':
        return 'warning';
      case 'BAJO':
        return 'success';
      default:
        return 'default';
    }
  };

  const renderCaseDetails = (archivedCase: ArchivedCase) => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Información General
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Número de Caso"
                  secondary={archivedCase.case_number}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Descripción"
                  secondary={archivedCase.case_data.description || 'Sin descripción'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Estado Original"
                  secondary={
                    <Chip
                      label={archivedCase.case_data.status}
                      size="small"
                      color="primary"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Complejidad"
                  secondary={
                    <Chip
                      label={archivedCase.case_data.complexity}
                      size="small"
                      color={getComplexityColor(archivedCase.case_data.complexity)}
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Puntuación de Clasificación"
                  secondary={archivedCase.case_data.classification_score}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Responsables
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Usuario Asignado"
                  secondary={archivedCase.case_data.user_id || 'No asignado'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Aplicación"
                  secondary={archivedCase.case_data.application_id}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Origen"
                  secondary={archivedCase.case_data.origin_id}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Fechas
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Creado"
                  secondary={formatDate(archivedCase.case_data.created_at)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Última actualización"
                  secondary={formatDate(archivedCase.case_data.updated_at)}
                />
              </ListItem>
              {archivedCase.case_data.completed_at && (
                <ListItem>
                  <ListItemText
                    primary="Completado"
                    secondary={formatDate(archivedCase.case_data.completed_at)}
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ArchiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Información de Archivo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Estado de Retención
                </Typography>
                <Chip
                  label={item.retention_status}
                  color={getRetentionStatusColor(item.retention_status)}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Archivado por
                </Typography>
                <Typography variant="body1">
                  {item.archived_by_user?.name || item.archived_by || 'Sistema'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Fecha de Archivo
                </Typography>
                <Typography variant="body1">
                  {formatDate(item.archived_at)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Razón del Archivo
                </Typography>
                <Typography variant="body1">
                  {item.archive_reason} {item.archive_reason_text && `- ${item.archive_reason_text}`}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Retención hasta
                </Typography>
                <Typography variant="body1" color="warning.main">
                  {formatDate(item.retention_until)}
                </Typography>
              </Grid>
              {isCase && (item as ArchivedCase).reactivation_count > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Reactivaciones
                  </Typography>
                  <Typography variant="body1">
                    {(item as ArchivedCase).reactivation_count} veces
                    {(item as ArchivedCase).last_reactivated_at && ` (última: ${formatDate((item as ArchivedCase).last_reactivated_at!)})`}
                  </Typography>
                </Grid>
              )}
              {item.is_legal_hold && (
                <Grid item xs={12}>
                  <Chip
                    label="RETENCIÓN LEGAL"
                    color="warning"
                    variant="outlined"
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTodoDetails = (archivedTodo: ArchivedTodo) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Información del TODO
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Título"
                  secondary={archivedTodo.todo_data.title}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Descripción"
                  secondary={archivedTodo.todo_data.description || 'Sin descripción'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Estado Original"
                  secondary={
                    <Chip
                      label={archivedTodo.todo_data.status}
                      size="small"
                      color="primary"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Asignado a"
                  secondary={archivedTodo.todo_data.assigned_to}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Creado por"
                  secondary={archivedTodo.todo_data.created_by}
                />
              </ListItem>
              {archivedTodo.case_id && (
                <ListItem>
                  <ListItemText
                    primary="Caso Asociado"
                    secondary={`ID: ${archivedTodo.case_id}`}
                  />
                </ListItem>
              )}
              {archivedTodo.todo_data.due_date && (
                <ListItem>
                  <ListItemText
                    primary="Fecha límite"
                    secondary={formatDate(archivedTodo.todo_data.due_date)}
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ArchiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Información de Archivo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Estado de Retención
                </Typography>
                <Chip
                  label={item.retention_status}
                  color={getRetentionStatusColor(item.retention_status)}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Fecha de Archivo
                </Typography>
                <Typography variant="body1">
                  {formatDate(item.archived_at)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Razón del Archivo
                </Typography>
                <Typography variant="body1">
                  {item.archive_reason} {item.archive_reason_text && `- ${item.archive_reason_text}`}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Retención hasta
                </Typography>
                <Typography variant="body1" color="warning.main">
                  {formatDate(item.retention_until)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            {isCase ? `Caso Archivado: ${(item as ArchivedCase).case_number}` : 'TODO Archivado'}
          </Typography>
          <Chip
            label={item.retention_status}
            color={getRetentionStatusColor(item.retention_status)}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isCase ? renderCaseDetails(item as ArchivedCase) : renderTodoDetails(item as ArchivedTodo)}
      </DialogContent>

      <DialogActions>
        <Box display="flex" gap={1} width="100%" justifyContent="space-between">
          <Box>
            {canRestore && item.retention_status === 'ACTIVE' && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<RestoreIcon />}
                onClick={() => onRestore?.(item)}
              >
                Restaurar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete?.(item)}
                sx={{ ml: 1 }}
              >
                Eliminar Permanentemente
              </Button>
            )}
          </Box>
          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ArchivedItemViewer;
