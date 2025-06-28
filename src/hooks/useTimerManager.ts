import { useState, useEffect, useCallback } from 'react';
import { timeService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';

interface TimerState {
  running: boolean;
  seconds: number;
  todoId: string | null;
  timeEntryId: string | null;
}

export const useTimerManager = () => {
  const { user } = useAuthStore();
  const [timer, setTimer] = useState<TimerState>({ 
    running: false, 
    seconds: 0, 
    todoId: null,
    timeEntryId: null 
  });
  const [activeTimers, setActiveTimers] = useState<any[]>([]);

  // Efecto para el contador del timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.running) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.running]);

  // Cargar timers activos al inicializar
  const loadActiveTimers = useCallback(async () => {
    if (!user) return;
    
    try {
      const timers = await timeService.getActiveTimers(user.id);
      setActiveTimers([...timers.timeEntries, ...timers.timeTracking]);
    } catch (error) {
      console.error('Error al cargar timers activos:', error);
    }
  }, [user]);

  useEffect(() => {
    loadActiveTimers();
  }, [loadActiveTimers]);

  const startTimer = async (todoId: string) => {
    if (!user) return;
    
    try {
      if (timer.running) {
        toast.warning('Ya hay un timer en ejecución');
        return;
      }

      const timeEntry = await timeService.startTimer(undefined, todoId, user.id, 'Timer iniciado desde TODO');
      
      setTimer({
        running: true,
        seconds: 0,
        todoId,
        timeEntryId: timeEntry.id
      });

      await loadActiveTimers();
      toast.success('Timer iniciado');
    } catch (error) {
      toast.error('Error al iniciar el timer');
      console.error(error);
    }
  };

  const stopTimer = async () => {
    if (!timer.running || !timer.timeEntryId) return;
    
    try {
      await timeService.stopTimer(timer.timeEntryId, 'todo');
      
      setTimer({
        running: false,
        seconds: 0,
        todoId: null,
        timeEntryId: null
      });

      await loadActiveTimers();
      toast.success('Timer detenido y guardado');
    } catch (error) {
      toast.error('Error al detener el timer');
      console.error(error);
    }
  };

  const addManualTime = async (todoId: string, hours: number, minutes: number, description: string, date: string) => {
    if (!user) return;
    
    try {
      await timeService.addManualTime(todoId, user.id, hours, minutes, description, date);
      toast.success('Tiempo manual agregado');
    } catch (error) {
      toast.error('Error al agregar tiempo manual');
      console.error(error);
    }
  };

  const deleteTimeEntry = async (id: string, type: 'case' | 'todo') => {
    try {
      await timeService.deleteTimeEntry(id, type);
      await loadActiveTimers();
      toast.success('Registro de tiempo eliminado');
    } catch (error) {
      toast.error('Error al eliminar el registro de tiempo');
      console.error(error);
    }
  };

  const getTimeEntriesForTodo = async (todoId: string) => {
    try {
      return await timeService.getTimeTrackingByTodo(todoId);
    } catch (error) {
      console.error('Error al obtener registros de tiempo:', error);
      return [];
    }
  };

  // Función para detener todos los timers activos (usada por el session manager)
  const stopAllActiveTimers = async () => {
    if (!user) return;
    
    try {
      await timeService.stopAllActiveTimers(user.id);
      setTimer({
        running: false,
        seconds: 0,
        todoId: null,
        timeEntryId: null
      });
      setActiveTimers([]);
    } catch (error) {
      console.error('Error al detener todos los timers:', error);
    }
  };

  return {
    timer,
    activeTimers,
    startTimer,
    stopTimer,
    addManualTime,
    deleteTimeEntry,
    getTimeEntriesForTodo,
    loadActiveTimers,
    stopAllActiveTimers
  };
};
