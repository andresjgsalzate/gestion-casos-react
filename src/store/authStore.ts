import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AuthState, User } from '../types';
import { verifyPassword } from '../utils/passwordUtils';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  validateUser: () => Promise<boolean>;
}

// Función para validar la integridad del usuario
const isValidUser = (user: any): user is User => {
  return user && 
         typeof user.id === 'string' && 
         typeof user.name === 'string' && 
         typeof user.email === 'string' && 
         typeof user.is_active === 'boolean' &&
         user.is_active === true;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user: User | null) => set({ user }),

  validateUser: async () => {
    const { user } = get();
    if (!user?.id) return false;

    try {
      // Verificar que el usuario aún existe y está activo en la base de datos
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          name, 
          is_active, 
          role_id,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        // Si el usuario no existe o no está activo, limpiar la sesión
        localStorage.removeItem('currentUser');
        set({ user: null, session: null });
        return false;
      }

      // Mantener los datos completos del usuario (incluyendo roles)
      // solo actualizar los campos básicos si han cambiado
      const updatedUser = {
        ...user,
        name: userData.name,
        email: userData.email,
        is_active: userData.is_active,
        role_id: userData.role_id,
        updated_at: userData.updated_at
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      set({ user: updatedUser });

      return true;
    } catch (error) {
      return false;
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ loading: true });
      
      // Validación básica de entrada
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      if (!email.includes('@')) {
        throw new Error('Por favor ingresa un email válido');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      // Buscar el usuario primero sin filtrar por is_active para dar mensajes específicos
      let userData, error;
      
      try {
        // Intentar consulta completa con relaciones
        const response = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            password,
            role_id,
            is_active,
            created_at,
            updated_at,
            roles (
              id,
              name,
              description,
              role_permissions (
                permissions (
                  id,
                  name,
                  module,
                  action
                )
              )
            )
          `)
          .eq('email', email.toLowerCase().trim())
          .single();
          
        userData = response.data;
        error = response.error;
      } catch (selectError) {
        console.error('Error with complex query, trying simple query:', selectError);
        
        // Fallback a consulta simple sin relaciones
        const response = await supabase
          .from('users')
          .select('id, email, name, password, role_id, is_active, created_at, updated_at')
          .eq('email', email.toLowerCase().trim())
          .single();
          
        userData = response.data;
        error = response.error;
        
        // Si la consulta simple funciona, agregar roles manualmente
        if (userData && !error) {
          const { data: roleData } = await supabase
            .from('roles')
            .select(`
              id,
              name,
              description,
              role_permissions (
                permissions (
                  id,
                  name,
                  module,
                  action
                )
              )
            `)
            .eq('id', userData.role_id)
            .single();
            
          if (roleData) {
            (userData as any).roles = roleData;
          }
        }
      }

      if (error) {
        console.error('Supabase error details:', error);
        // Si hay un error 406 o similar, es probable que sea un problema de permisos/configuración
        if (error.code === 'PGRST301' || error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          throw new Error('Error de configuración del sistema. Contacta al administrador.');
        }
        throw new Error('Email o contraseña incorrectos. Por favor verifica tus credenciales.');
      }

      if (!userData) {
        throw new Error('Email o contraseña incorrectos. Por favor verifica tus credenciales.');
      }

      // Verificar si el usuario está activo
      if (!userData.is_active) {
        throw new Error('Tu cuenta está desactivada. Contacta al administrador para más información.');
      }

      // Verificar la contraseña
      const isPasswordValid = await verifyPassword(password, userData.password);
      
      if (!isPasswordValid) {
        throw new Error('Email o contraseña incorrectos. Por favor verifica tus credenciales.');
      }

      // Validar integridad del usuario
      if (!isValidUser(userData)) {
        throw new Error('Error en los datos del usuario');
      }

      // Remover la contraseña de los datos del usuario antes de guardar
      const { password: _, ...userWithoutPassword } = userData;
      
      // Guardar el usuario completo en localStorage (sin contraseña)
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      set({ user: userWithoutPassword, session: { user: userWithoutPassword }, loading: false });
      
      return userWithoutPassword;
    } catch (error) {
      // Asegurar que el estado se limpia completamente en caso de error
      localStorage.removeItem('currentUser');
      set({ user: null, session: null, loading: false });
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem('currentUser');
    set({ user: null, session: null, loading: false });
  },

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Verificar si hay un usuario guardado en localStorage
      const savedUser = localStorage.getItem('currentUser');
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        // Solo establecer el usuario si tiene todas las propiedades necesarias y es válido
        if (isValidUser(user)) {
          set({ user, session: { user }, loading: false });
          // Validar en background, pero no bloquear el login inicial
          setTimeout(() => {
            get().validateUser();
          }, 1000);
        } else {
          // Si el usuario guardado no es válido, limpiar localStorage
          localStorage.removeItem('currentUser');
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (error) {
      // Si hay error parseando el JSON, limpiar localStorage
      localStorage.removeItem('currentUser');
      set({ loading: false });
    }
  },
}));
