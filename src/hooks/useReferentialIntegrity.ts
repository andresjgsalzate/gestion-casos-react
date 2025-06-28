import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

export const useReferentialIntegrity = () => {
  const { validateUser } = useAuthStore();

  const handleReferentialError = useCallback((error: any) => {
    console.error('Referential integrity error:', error);

    // Errores específicos de integridad referencial
    if (error?.code === '23503') { // Foreign key violation
      if (error.message?.includes('user_id')) {
        toast.error('Error: Usuario no válido. Inicie sesión nuevamente.');
        return;
      } else if (error.message?.includes('application_id')) {
        toast.error('Error: La aplicación seleccionada no es válida.');
        return;
      } else if (error.message?.includes('origin_id')) {
        toast.error('Error: El origen seleccionado no es válido.');
        return;
      } else if (error.message?.includes('priority_id')) {
        toast.error('Error: La prioridad seleccionada no es válida.');
        return;
      } else if (error.message?.includes('case_id')) {
        toast.error('Error: El caso especificado no es válido.');
        return;
      } else if (error.message?.includes('todo_id')) {
        toast.error('Error: El TODO especificado no es válido.');
        return;
      } else if (error.message?.includes('role_id')) {
        toast.error('Error: El rol especificado no es válido.');
        return;
      } else {
        toast.error('Error de integridad: Verifique que todos los datos sean válidos.');
        return;
      }
    }

    // Errores de duplicación
    if (error?.code === '23505') { // Unique violation
      if (error.message?.includes('case_number')) {
        toast.error('Error: Ya existe un caso con este número.');
        return;
      } else if (error.message?.includes('email')) {
        toast.error('Error: Ya existe un usuario con este email.');
        return;
      } else {
        toast.error('Error: Ya existe un registro con estos datos.');
        return;
      }
    }

    // Error general
    const errorMessage = error?.message || error?.details || 'Error inesperado';
    toast.error(`Error: ${errorMessage}`);
  }, []);

  const validateUserSession = useCallback(async () => {
    const isValid = await validateUser();
    if (!isValid) {
      toast.error('Sesión inválida. Por favor, inicie sesión nuevamente.');
      return false;
    }
    return true;
  }, [validateUser]);

  const safeExecute = useCallback(async <T>(
    operation: () => Promise<T>,
    errorPrefix?: string
  ): Promise<T | null> => {
    try {
      // Validar sesión antes de ejecutar
      const isSessionValid = await validateUserSession();
      if (!isSessionValid) {
        throw new Error('Sesión no válida');
      }

      return await operation();
    } catch (error: any) {
      console.error(`${errorPrefix || 'Operation'} error:`, error);
      handleReferentialError(error);
      return null;
    }
  }, [handleReferentialError, validateUserSession]);

  return {
    handleReferentialError,
    validateUserSession,
    safeExecute
  };
};

export default useReferentialIntegrity;
