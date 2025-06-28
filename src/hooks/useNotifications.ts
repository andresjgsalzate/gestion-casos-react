import { toast, ToastOptions, Id } from 'react-toastify';

interface NotificationOptions extends ToastOptions {
  persist?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationService {
  success: (message: string, options?: NotificationOptions) => Id;
  error: (message: string, options?: NotificationOptions) => Id;
  warning: (message: string, options?: NotificationOptions) => Id;
  info: (message: string, options?: NotificationOptions) => Id;
  loading: (message: string) => Id;
  update: (toastId: Id, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  dismiss: (toastId?: Id) => void;
  dismissAll: () => void;
}

export const useNotifications = (): NotificationService => {
  const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const logNotification = async (type: string, message: string, userId?: string) => {
    try {
      // Notification logged successfully (removed logging for production)
    } catch (error) {
      // Error logging notification (removed console.error for production)
    }
  };

  const success = (message: string, options?: NotificationOptions): Id => {
    logNotification('success', message);
    
    return toast.success(message, {
      ...defaultOptions,
      autoClose: options?.persist ? false : defaultOptions.autoClose,
      ...options,
    });
  };

  const error = (message: string, options?: NotificationOptions): Id => {
    logNotification('error', message);
    
    return toast.error(message, {
      ...defaultOptions,
      autoClose: options?.persist ? false : 8000, // Errores duran más
      ...options,
    });
  };

  const warning = (message: string, options?: NotificationOptions): Id => {
    logNotification('warning', message);
    
    return toast.warning(message, {
      ...defaultOptions,
      autoClose: options?.persist ? false : 6000,
      ...options,
    });
  };

  const info = (message: string, options?: NotificationOptions): Id => {
    logNotification('info', message);
    
    return toast.info(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const loading = (message: string): Id => {
    return toast.loading(message, {
      ...defaultOptions,
      autoClose: false,
    });
  };

  const update = (toastId: Id, message: string, type: 'success' | 'error' | 'warning' | 'info'): void => {
    const typeMap = {
      success: toast.TYPE.SUCCESS,
      error: toast.TYPE.ERROR,
      warning: toast.TYPE.WARNING,
      info: toast.TYPE.INFO,
    };

    toast.update(toastId, {
      render: message,
      type: typeMap[type],
      isLoading: false,
      autoClose: type === 'error' ? 8000 : 5000,
    });
  };

  const dismiss = (toastId?: Id): void => {
    toast.dismiss(toastId);
  };

  const dismissAll = (): void => {
    toast.dismiss();
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    update,
    dismiss,
    dismissAll,
  };
};

// Hook para notificaciones específicas del negocio
export const useBusinessNotifications = () => {
  const notifications = useNotifications();

  const caseNotifications = {
    created: (caseNumber: string) => 
      notifications.success(`Caso ${caseNumber} creado exitosamente`),
    
    updated: (caseNumber: string) => 
      notifications.success(`Caso ${caseNumber} actualizado exitosamente`),
    
    deleted: (caseNumber: string) => 
      notifications.success(`Caso ${caseNumber} eliminado exitosamente`),
    
    assigned: (caseNumber: string, userName: string) => 
      notifications.info(`Caso ${caseNumber} asignado a ${userName}`),
    
    statusChanged: (caseNumber: string, newStatus: string) => 
      notifications.info(`Estado del caso ${caseNumber} cambiado a ${newStatus}`),
    
    escalated: (caseNumber: string) => 
      notifications.warning(`Caso ${caseNumber} escalado`, { persist: true }),
  };

  const todoNotifications = {
    created: (title: string) => 
      notifications.success(`TODO "${title}" creado exitosamente`),
    
    completed: (title: string) => 
      notifications.success(`TODO "${title}" marcado como completado`),
    
    overdue: (title: string) => 
      notifications.warning(`TODO "${title}" está vencido`, { persist: true }),
    
    timerStarted: (title: string) => 
      notifications.info(`Timer iniciado para "${title}"`),
    
    timerStopped: (title: string, duration: string) => 
      notifications.success(`Timer detenido para "${title}". Duración: ${duration}`),
  };

  const systemNotifications = {
    sessionExpiring: () => 
      notifications.warning('Tu sesión expirará en 5 minutos', { 
        persist: true,
        action: {
          label: 'Extender',
          onClick: () => {
            // Lógica para extender sesión
            notifications.success('Sesión extendida exitosamente');
          }
        }
      }),
    
    backupCompleted: () => 
      notifications.success('Respaldo de datos completado'),
    
    maintenanceScheduled: (date: string) => 
      notifications.info(`Mantenimiento programado para ${date}`, { persist: true }),
    
    newUpdate: () => 
      notifications.info('Nueva actualización disponible', {
        action: {
          label: 'Ver cambios',
          onClick: () => {
            // Abrir modal de novedades
          }
        }
      }),
  };

  return {
    ...notifications,
    cases: caseNotifications,
    todos: todoNotifications,
    system: systemNotifications,
  };
};

// Utilidades para notificaciones
export const notificationUtils = {
  // Formatear duración de tiempo
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  },

  // Formatear fecha relativa
  formatRelativeTime: (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  },

  // Validar si el usuario permite notificaciones del navegador
  requestNotificationPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Enviar notificación nativa del navegador
  sendBrowserNotification: (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: options?.toString(),
        icon: '/favicon.ico',
        badge: '/favicon-32x32.png',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);
    }
  },
};
