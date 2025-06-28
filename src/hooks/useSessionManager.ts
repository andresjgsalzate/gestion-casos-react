import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { timeService } from '../services/api';

export const useSessionManager = () => {
  const { user, logout } = useAuthStore();
  const savingTimersRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Prevenir múltiples ejecuciones
      if (savingTimersRef.current) return;
      savingTimersRef.current = true;

      try {
        // Obtener todos los timers activos del usuario
        const activeTimers = await timeService.getActiveTimers(user.id);
        
        if (activeTimers.timeEntries.length > 0 || activeTimers.timeTracking.length > 0) {
          // Mostrar mensaje de confirmación
          const message = `Tienes ${activeTimers.timeEntries.length + activeTimers.timeTracking.length} timer(s) activo(s) que se guardarán automáticamente. ¿Estás seguro de que quieres cerrar?`;
          event.preventDefault();
          event.returnValue = message;
          
          // Intentar guardar los timers usando sendBeacon para mayor confiabilidad
          const saveTimersUrl = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/rpc/stop_all_user_timers`;
          const payload = JSON.stringify({ user_id: user.id });
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon(saveTimersUrl, payload);
          } else {
            // Fallback: detener todos los timers activos
            await timeService.stopAllActiveTimers(user.id);
          }
          
          return message;
        }
      } catch (error) {
        console.error('Error al guardar timers activos:', error);
      } finally {
        savingTimersRef.current = false;
      }
    };

    const handleUnload = async () => {
      try {
        if (user && !savingTimersRef.current) {
          // Usar sendBeacon para mayor confiabilidad al cerrar la página
          const saveTimersUrl = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/rpc/stop_all_user_timers`;
          const payload = JSON.stringify({ user_id: user.id });
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon(saveTimersUrl, payload);
          }
        }
      } catch (error) {
        console.error('Error al finalizar sesión:', error);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && user && !savingTimersRef.current) {
        try {
          savingTimersRef.current = true;
          // Cuando la página se oculta, guardar tiempos activos
          await timeService.stopAllActiveTimers(user.id);
        } catch (error) {
          console.error('Error al guardar timers en visibilitychange:', error);
        } finally {
          setTimeout(() => {
            savingTimersRef.current = false;
          }, 1000);
        }
      }
    };

    // Manejar cuando la página pierde el foco
    const handlePageHide = async () => {
      if (user && !savingTimersRef.current) {
        try {
          savingTimersRef.current = true;
          await timeService.stopAllActiveTimers(user.id);
        } catch (error) {
          console.error('Error al guardar timers en pagehide:', error);
        }
      }
    };

    // Agregar event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Función para cerrar sesión manualmente guardando tiempos activos
  const logoutWithTimerSave = async () => {
    if (!user) return;
    
    try {
      savingTimersRef.current = true;
      // Guardar todos los timers activos antes de cerrar sesión
      await timeService.stopAllActiveTimers(user.id);
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Cerrar sesión de todas formas
      await logout();
    } finally {
      savingTimersRef.current = false;
    }
  };

  return {
    logoutWithTimerSave
  };
};
