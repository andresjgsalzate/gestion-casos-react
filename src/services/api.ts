import { supabase } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { 
  User, 
  Role, 
  Permission, 
  Application, 
  Origin, 
  Priority, 
  Case, 
  Todo, 
  TimeEntry, 
  TimeTracking,
  UserFormData,
  CaseFormData,
  TodoFormData 
} from '../types';

// Servicio de Usuarios
export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(userData: UserFormData): Promise<User> {
    // Validar que el rol existe
    if (userData.role_id) {
      const { data: roleExists, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', userData.role_id)
        .single();

      if (roleError || !roleExists) {
        throw new Error('El rol especificado no existe');
      }
    }

    // Validar que el email no esté duplicado
    const { data: emailExists, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (!emailError && emailExists) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Hashear la contraseña antes de guardar
    const hashedPassword = userData.password ? await hashPassword(userData.password) : null;
    
    if (!hashedPassword) {
      throw new Error('La contraseña es requerida');
    }

    const userDataWithHashedPassword = {
      ...userData,
      password: hashedPassword
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userDataWithHashedPassword)
      .select()
      .single();
    
    if (error) {
      console.error('Error creando usuario:', error);
      throw new Error(error.message || 'Error al crear el usuario');
    }
    
    // No devolver la contraseña en la respuesta
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword as User;
  },

  async update(id: string, userData: Partial<UserFormData>): Promise<User> {
    // Validar que el usuario existe
    const { data: userExists, error: userExistsError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (userExistsError || !userExists) {
      throw new Error('El usuario especificado no existe');
    }

    // Validar que el rol existe si se está actualizando
    if (userData.role_id) {
      const { data: roleExists, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', userData.role_id)
        .single();

      if (roleError || !roleExists) {
        throw new Error('El rol especificado no existe');
      }
    }

    // Validar que el email no esté duplicado por otro usuario
    if (userData.email) {
      const { data: emailExists, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .neq('id', id)
        .single();

      if (!emailError && emailExists) {
        throw new Error('Ya existe otro usuario con este email');
      }
    }

    // Preparar datos para actualización
    const updateData: any = { ...userData };
    
    // Si se proporciona una nueva contraseña, hashearla
    if (userData.password && userData.password.trim()) {
      updateData.password = await hashPassword(userData.password);
    } else {
      // Si no se proporciona contraseña, no la actualizamos
      delete updateData.password;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error(error.message || 'Error al actualizar el usuario');
    }
    
    // No devolver la contraseña en la respuesta
    const { password, ...userWithoutPassword } = data;
    return userWithoutPassword as User;
  },

  async delete(id: string): Promise<void> {
    // Verificar que el usuario existe y obtener sus datos para el log
    const { data: userToDelete, error: userExistsError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userExistsError || !userToDelete) {
      throw new Error('El usuario especificado no existe');
    }

    // Verificar si el usuario tiene casos asignados
    const { data: casesCount, error: casesError } = await supabase
      .from('cases')
      .select('id')
      .eq('user_id', id)
      .limit(1);

    if (casesError) {
      throw new Error('Error al verificar casos asignados');
    }

    if (casesCount && casesCount.length > 0) {
      throw new Error('No se puede eliminar el usuario porque tiene casos asignados');
    }

    // Verificar si el usuario tiene TODOs asignados o creados
    const { data: todosCount, error: todosError } = await supabase
      .from('todos')
      .select('id')
      .or(`assigned_to.eq.${id},created_by.eq.${id}`)
      .limit(1);

    if (todosError) {
      throw new Error('Error al verificar TODOs asignados');
    }

    if (todosCount && todosCount.length > 0) {
      throw new Error('No se puede eliminar el usuario porque tiene TODOs asignados o creados');
    }

    // Verificar si el usuario tiene registros de tiempo
    const { data: timeCount, error: timeError } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', id)
      .limit(1);

    if (timeError) {
      throw new Error('Error al verificar registros de tiempo');
    }

    if (timeCount && timeCount.length > 0) {
      throw new Error('No se puede eliminar el usuario porque tiene registros de tiempo');
    }

    // Eliminar el usuario
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error eliminando usuario:', error);
      throw new Error(error.message || 'Error al eliminar el usuario');
    }

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'users',
        operation: 'DELETE',
        record_id: id,
        old_data: userToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Usuario eliminado: ${userToDelete.name} (${userToDelete.email})`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
      // No lanzar error para no afectar la operación principal
    }
  },

  async toggleActive(id: string, isActive: boolean): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Obtener el usuario actual del store (autenticación personalizada)
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        throw new Error('Usuario no autenticado');
      }

      const user = JSON.parse(storedUser);
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el usuario completo de la base de datos para verificar la contraseña
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, password')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        logger.error('Error fetching user data for password change:', userError);
        throw new Error('Usuario no encontrado');
      }

      // Verificar la contraseña actual
      const isCurrentPasswordValid = await verifyPassword(currentPassword, userData.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await hashPassword(newPassword);

      // Actualizar la contraseña en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        logger.error('Error updating password:', updateError);
        throw new Error(updateError.message || 'Error al cambiar la contraseña');
      }

      logger.info('Password changed successfully for user:', user.id);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }
};

// Servicio de Roles
export const roleService = {
  async getAll(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permissions (
            id,
            name,
            description,
            module,
            action
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        role_permissions (
          permissions (
            id,
            name,
            description,
            module,
            action
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(roleData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(roleData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Obtener los datos del rol antes de eliminarlo para auditoría
    const { data: roleToDelete, error: getRoleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (getRoleError || !roleToDelete) {
      throw new Error('El rol especificado no existe');
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'roles',
        operation: 'DELETE',
        record_id: id,
        old_data: roleToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Rol eliminado: ${roleToDelete.name} - ${roleToDelete.description}`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  },

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Primero eliminar permisos existentes
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Luego insertar los nuevos permisos
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);
      
      if (error) throw error;
    }
  }
};

// Servicio de Permisos
export const permissionService = {
  async getAll(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getByModule(module: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('module', module)
      .order('action', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(permissionData: Omit<Permission, 'id' | 'created_at' | 'updated_at'>): Promise<Permission> {
    const { data, error } = await supabase
      .from('permissions')
      .insert(permissionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, permissionData: Partial<Omit<Permission, 'id' | 'created_at' | 'updated_at'>>): Promise<Permission> {
    const { data, error } = await supabase
      .from('permissions')
      .update(permissionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Obtener los datos del permiso antes de eliminarlo para auditoría
    const { data: permissionToDelete, error: getPermissionError } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();

    if (getPermissionError || !permissionToDelete) {
      throw new Error('El permiso especificado no existe');
    }

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'permissions',
        operation: 'DELETE',
        record_id: id,
        old_data: permissionToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Permiso eliminado: ${permissionToDelete.name} (${permissionToDelete.module}.${permissionToDelete.action})`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  }
};

// Servicio de Aplicaciones
export const applicationService = {
  async getAll(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(appData: Omit<Application, 'id' | 'created_at' | 'updated_at'>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(appData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, appData: Partial<Application>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update(appData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Obtener los datos de la aplicación antes de eliminarla para auditoría
    const { data: appToDelete, error: getAppError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (getAppError || !appToDelete) {
      throw new Error('La aplicación especificada no existe');
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'applications',
        operation: 'DELETE',
        record_id: id,
        old_data: appToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Aplicación eliminada: ${appToDelete.name} - ${appToDelete.description}`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  }
};

// Servicio de Orígenes
export const originService = {
  async getAll(): Promise<Origin[]> {
    const { data, error } = await supabase
      .from('origins')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(originData: Omit<Origin, 'id' | 'created_at' | 'updated_at'>): Promise<Origin> {
    const { data, error } = await supabase
      .from('origins')
      .insert(originData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, originData: Partial<Origin>): Promise<Origin> {
    const { data, error } = await supabase
      .from('origins')
      .update(originData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Obtener los datos del origen antes de eliminarlo para auditoría
    const { data: originToDelete, error: getOriginError } = await supabase
      .from('origins')
      .select('*')
      .eq('id', id)
      .single();

    if (getOriginError || !originToDelete) {
      throw new Error('El origen especificado no existe');
    }

    const { error } = await supabase
      .from('origins')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'origins',
        operation: 'DELETE',
        record_id: id,
        old_data: originToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Origen eliminado: ${originToDelete.name} - ${originToDelete.description}`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  }
};

// Servicio de Prioridades
export const priorityService = {
  async getAll(): Promise<Priority[]> {
    const { data, error } = await supabase
      .from('priorities')
      .select('*')
      .order('level', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(priorityData: Omit<Priority, 'id' | 'created_at' | 'updated_at'>): Promise<Priority> {
    const { data, error } = await supabase
      .from('priorities')
      .insert(priorityData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, priorityData: Partial<Priority>): Promise<Priority> {
    const { data, error } = await supabase
      .from('priorities')
      .update(priorityData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Obtener los datos de la prioridad antes de eliminarla para auditoría
    const { data: priorityToDelete, error: getPriorityError } = await supabase
      .from('priorities')
      .select('*')
      .eq('id', id)
      .single();

    if (getPriorityError || !priorityToDelete) {
      throw new Error('La prioridad especificada no existe');
    }

    const { error } = await supabase
      .from('priorities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'priorities',
        operation: 'DELETE',
        record_id: id,
        old_data: priorityToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Prioridad eliminada: ${priorityToDelete.name} (Nivel ${priorityToDelete.level}) - ${priorityToDelete.description}`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  }
};

// Servicio de Casos
export const caseService = {
  async getAll(currentUserId?: string, isAdmin: boolean = false): Promise<Case[]> {
    let query = supabase
      .from('cases')
      .select(`
        *,
        applications!inner(name),
        origins!inner(name),
        priorities!inner(name, level),
        users!inner(name)
      `);

    // Si no es admin, filtrar solo los casos del usuario actual
    if (!isAdmin && currentUserId) {
      query = query.eq('user_id', currentUserId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transformar los datos para que las columnas del DataGrid funcionen
    const transformedData = (data || []).map(caso => ({
      ...caso,
      application_name: caso.applications?.name || 'N/A',
      origin_name: caso.origins?.name || 'N/A',
      priority_name: caso.priorities?.name || 'N/A',
      user_name: caso.users?.name || 'N/A'
    }));
    
    return transformedData;
  },

  async getById(id: string, currentUserId?: string, isAdmin: boolean = false): Promise<Case | null> {
    let query = supabase
      .from('cases_detailed')
      .select('*')
      .eq('id', id);

    // Si no es admin, verificar que el caso pertenece al usuario actual
    if (!isAdmin && currentUserId) {
      query = query.eq('user_id', currentUserId);
    }

    const { data, error } = await query.single();
    
    if (error) {
      // Si es error de no encontrado y no es admin, podría ser que no tiene permisos
      if (error.code === 'PGRST116' && !isAdmin) {
        throw new Error('No tienes permisos para ver este caso o el caso no existe');
      }
      throw error;
    }
    return data;
  },

  async create(caseData: CaseFormData, userId: string): Promise<Case> {
    // Validar que el usuario existe antes de crear el caso
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (userError || !userExists) {
      throw new Error('El usuario especificado no existe o no está activo');
    }

    // Validar que la aplicación existe y está activa
    if (caseData.application_id) {
      const { data: appExists, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('id', caseData.application_id)
        .eq('is_active', true)
        .single();

      if (appError || !appExists) {
        throw new Error('La aplicación especificada no existe o no está activa');
      }
    }

    // Validar que el origen existe y está activo
    if (caseData.origin_id) {
      const { data: originExists, error: originError } = await supabase
        .from('origins')
        .select('id')
        .eq('id', caseData.origin_id)
        .eq('is_active', true)
        .single();

      if (originError || !originExists) {
        throw new Error('El origen especificado no existe o no está activo');
      }
    }

    // Validar que la prioridad existe y está activa
    if (caseData.priority_id) {
      const { data: priorityExists, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', caseData.priority_id)
        .eq('is_active', true)
        .single();

      if (priorityError || !priorityExists) {
        throw new Error('La prioridad especificada no existe o no está activa');
      }
    }

    // Validar que el número de caso no esté duplicado
    const { data: caseExists, error: caseExistsError } = await supabase
      .from('cases')
      .select('id')
      .eq('case_number', caseData.case_number)
      .single();

    if (!caseExistsError && caseExists) {
      throw new Error('Ya existe un caso con este número');
    }

    const { data, error } = await supabase
      .from('cases')
      .insert({
        ...caseData,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creando caso:', error);
      throw new Error(error.message || 'Error al crear el caso');
    }
    return data;
  },

  async update(id: string, caseData: Partial<CaseFormData>, currentUserId?: string, isAdmin: boolean = false): Promise<Case> {
    // Validar que el caso existe
    let caseQuery = supabase
      .from('cases')
      .select('id, user_id')
      .eq('id', id);

    // Si no es admin, verificar que el caso pertenece al usuario actual
    if (!isAdmin && currentUserId) {
      caseQuery = caseQuery.eq('user_id', currentUserId);
    }

    const { data: caseExists, error: caseExistsError } = await caseQuery.single();

    if (caseExistsError || !caseExists) {
      if (caseExistsError?.code === 'PGRST116' && !isAdmin) {
        throw new Error('No tienes permisos para editar este caso o el caso no existe');
      }
      throw new Error('El caso especificado no existe');
    }

    // Validar campos si están presentes en la actualización
    if (caseData.application_id) {
      const { data: appExists, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('id', caseData.application_id)
        .eq('is_active', true)
        .single();

      if (appError || !appExists) {
        throw new Error('La aplicación especificada no existe o no está activa');
      }
    }

    if (caseData.origin_id) {
      const { data: originExists, error: originError } = await supabase
        .from('origins')
        .select('id')
        .eq('id', caseData.origin_id)
        .eq('is_active', true)
        .single();

      if (originError || !originExists) {
        throw new Error('El origen especificado no existe o no está activo');
      }
    }

    if (caseData.priority_id) {
      const { data: priorityExists, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', caseData.priority_id)
        .eq('is_active', true)
        .single();

      if (priorityError || !priorityExists) {
        throw new Error('La prioridad especificada no existe o no está activa');
      }
    }

    // Validar número de caso único si se está actualizando
    if (caseData.case_number) {
      const { data: duplicateCase, error: duplicateError } = await supabase
        .from('cases')
        .select('id')
        .eq('case_number', caseData.case_number)
        .neq('id', id)
        .single();

      if (!duplicateError && duplicateCase) {
        throw new Error('Ya existe otro caso con este número');
      }
    }

    const { data, error } = await supabase
      .from('cases')
      .update(caseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando caso:', error);
      throw new Error(error.message || 'Error al actualizar el caso');
    }
    return data;
  },

  async delete(id: string, currentUserId?: string, isAdmin: boolean = false): Promise<void> {
    // Validar que el caso existe y el usuario tiene permisos para eliminarlo
    let caseQuery = supabase
      .from('cases')
      .select(`
        *,
        applications(name),
        origins(name),
        priorities(name),
        users(name)
      `)
      .eq('id', id);

    // Si no es admin, verificar que el caso pertenece al usuario actual
    if (!isAdmin && currentUserId) {
      caseQuery = caseQuery.eq('user_id', currentUserId);
    }

    const { data: caseToDelete, error: caseExistsError } = await caseQuery.single();

    if (caseExistsError || !caseToDelete) {
      if (caseExistsError?.code === 'PGRST116' && !isAdmin) {
        throw new Error('No tienes permisos para eliminar este caso o el caso no existe');
      }
      throw new Error('El caso especificado no existe');
    }

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'cases',
        operation: 'DELETE',
        record_id: id,
        old_data: caseToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Caso eliminado: ${caseToDelete.case_number} - ${caseToDelete.description?.substring(0, 100)}...`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  },

  async updateStatus(id: string, status: Case['status']): Promise<Case> {
    const updateData: any = { status };
    if (status === 'TERMINADA') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Servicio de TODOs
export const todoService = {
  async getAll(currentUserId?: string, isAdmin: boolean = false): Promise<Todo[]> {
    let query = supabase
      .from('todos')
      .select(`
        *,
        priority:priorities(name),
        assigned_user:users!assigned_to(name),
        created_by_user:users!created_by(name),
        case:cases(case_number)
      `);

    // Si no es admin, filtrar solo los TODOs asignados al usuario o creados por él
    if (!isAdmin && currentUserId) {
      query = query.or(`assigned_to.eq.${currentUserId},created_by.eq.${currentUserId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Mapear los datos para que coincidan con la estructura esperada
    return (data || []).map(todo => ({
      ...todo,
      priority_name: todo.priority?.name || '',
      assigned_to_name: todo.assigned_user?.name || '',
      created_by_name: todo.created_by_user?.name || '',
      case_number: todo.case?.case_number || ''
    }));
  },

  async getByUser(userId: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select(`
        *,
        priority:priorities(name),
        assigned_user:users!assigned_to(name),
        created_by_user:users!created_by(name),
        case:cases(case_number)
      `)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Mapear los datos para que coincidan con la estructura esperada
    return (data || []).map(todo => ({
      ...todo,
      priority_name: todo.priority?.name || '',
      assigned_to_name: todo.assigned_user?.name || '',
      created_by_name: todo.created_by_user?.name || '',
      case_number: todo.case?.case_number || ''
    }));
  },

  async create(todoData: TodoFormData, createdBy: string): Promise<Todo> {
    // Validar que el usuario creador existe
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', createdBy)
      .eq('is_active', true)
      .single();

    if (userError || !userExists) {
      throw new Error('El usuario especificado no existe o no está activo');
    }

    // Validar usuario asignado si se especifica
    if (todoData.assigned_to) {
      const { data: assignedUserExists, error: assignedUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', todoData.assigned_to)
        .eq('is_active', true)
        .single();

      if (assignedUserError || !assignedUserExists) {
        throw new Error('El usuario asignado no existe o no está activo');
      }
    }

    // Validar prioridad si se especifica
    if (todoData.priority_id) {
      const { data: priorityExists, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', todoData.priority_id)
        .eq('is_active', true)
        .single();

      if (priorityError || !priorityExists) {
        throw new Error('La prioridad especificada no existe o no está activa');
      }
    }

    // Validar caso si se especifica
    if (todoData.case_id && todoData.case_id.trim() !== '') {
      const { data: caseExists, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', todoData.case_id)
        .single();

      if (caseError || !caseExists) {
        throw new Error('El caso especificado no existe');
      }
    }

    // Preparar los datos, removiendo case_id si está vacío
    const dataToInsert = {
      ...todoData,
      created_by: createdBy
    };
    
    // Si case_id está vacío, no lo incluimos en el insert
    if (!todoData.case_id || todoData.case_id.trim() === '') {
      delete dataToInsert.case_id;
    }

    const { data, error } = await supabase
      .from('todos')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      logger.error('Error creando TODO:', error);
      throw new Error(error.message || 'Error al crear el TODO');
    }
    return data;
  },

  async update(id: string, todoData: Partial<TodoFormData>): Promise<Todo> {
    // Validar que el TODO existe
    const { data: todoExists, error: todoExistsError } = await supabase
      .from('todos')
      .select('id')
      .eq('id', id)
      .single();

    if (todoExistsError || !todoExists) {
      throw new Error('El TODO especificado no existe');
    }

    // Validar usuario asignado si se está actualizando
    if (todoData.assigned_to) {
      const { data: assignedUserExists, error: assignedUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', todoData.assigned_to)
        .eq('is_active', true)
        .single();

      if (assignedUserError || !assignedUserExists) {
        throw new Error('El usuario asignado no existe o no está activo');
      }
    }

    // Validar prioridad si se está actualizando
    if (todoData.priority_id) {
      const { data: priorityExists, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', todoData.priority_id)
        .eq('is_active', true)
        .single();

      if (priorityError || !priorityExists) {
        throw new Error('La prioridad especificada no existe o no está activa');
      }
    }

    // Validar caso si se está actualizando
    if (todoData.case_id && todoData.case_id.trim() !== '') {
      const { data: caseExists, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', todoData.case_id)
        .single();

      if (caseError || !caseExists) {
        throw new Error('El caso especificado no existe');
      }
    }

    // Preparar los datos, removiendo case_id si está vacío
    const dataToUpdate = { ...todoData };
    if ('case_id' in dataToUpdate && (!dataToUpdate.case_id || dataToUpdate.case_id.trim() === '')) {
      delete dataToUpdate.case_id;
    }

    const { data, error } = await supabase
      .from('todos')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error actualizando TODO:', error);
      throw new Error(error.message || 'Error al actualizar el TODO');
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    // Obtener los datos del TODO antes de eliminarlo para auditoría
    const { data: todoToDelete, error: getTodoError } = await supabase
      .from('todos')
      .select(`
        *,
        priority:priorities(name),
        assigned_user:users!assigned_to(name),
        created_by_user:users!created_by(name),
        case:cases(case_number)
      `)
      .eq('id', id)
      .single();

    if (getTodoError || !todoToDelete) {
      throw new Error('El TODO especificado no existe');
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await auditService.createAuditLog({
        table_name: 'todos',
        operation: 'DELETE',
        record_id: id,
        old_data: todoToDelete,
        user_id: currentUser.id || 'unknown',
        description: `TODO eliminado: ${todoToDelete.title} - ${todoToDelete.description?.substring(0, 100)}...`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  },

  async updateStatus(id: string, status: Todo['status']): Promise<Todo> {
    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Servicio de Tiempo
export const timeService = {
  async startTimer(caseId?: string, todoId?: string, userId?: string, description?: string): Promise<TimeEntry | TimeTracking> {
    // Validar que el usuario existe
    if (userId) {
      const { data: userExists, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (userError || !userExists) {
        throw new Error('El usuario especificado no existe o no está activo');
      }
    }

    const startTime = new Date().toISOString();

    if (caseId) {
      // Validar que el caso existe
      const { data: caseExists, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', caseId)
        .single();

      if (caseError || !caseExists) {
        throw new Error('El caso especificado no existe');
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          case_id: caseId,
          user_id: userId,
          start_time: startTime,
          description
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error iniciando timer para caso:', error);
        throw new Error(error.message || 'Error al iniciar el timer');
      }
      return data;
    } else if (todoId) {
      // Validar que el TODO existe
      const { data: todoExists, error: todoError } = await supabase
        .from('todos')
        .select('id')
        .eq('id', todoId)
        .single();

      if (todoError || !todoExists) {
        throw new Error('El TODO especificado no existe');
      }

      const { data, error } = await supabase
        .from('time_tracking')
        .insert({
          todo_id: todoId,
          user_id: userId,
          start_time: startTime,
          description
        })
        .select()
        .single();
      
      if (error) {
        logger.error('Error iniciando timer para TODO:', error);
        throw new Error(error.message || 'Error al iniciar el timer');
      }
      return data;
    }

    throw new Error('Se debe proporcionar caseId o todoId');
  },

  async stopTimer(id: string, type: 'case' | 'todo'): Promise<TimeEntry | TimeTracking> {
    const endTime = new Date().toISOString();
    const table = type === 'case' ? 'time_entries' : 'time_tracking';

    const { data, error } = await supabase
      .from(table)
      .update({ end_time: endTime })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTimeEntriesByCase(caseId: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq('case_id', caseId)
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getTimeTrackingByTodo(todoId: string): Promise<TimeTracking[]> {
    const { data, error } = await supabase
      .from('time_tracking')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq('todo_id', todoId)
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getActiveTimers(userId: string): Promise<{ timeEntries: TimeEntry[], timeTracking: TimeTracking[] }> {
    // Obtener time entries activos (sin end_time)
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select(`
        *,
        cases (
          case_number,
          description
        )
      `)
      .eq('user_id', userId)
      .is('end_time', null);

    if (timeError) throw timeError;

    // Obtener time tracking activos (sin end_time)
    const { data: timeTracking, error: trackingError } = await supabase
      .from('time_tracking')
      .select(`
        *,
        todos (
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .is('end_time', null);

    if (trackingError) throw trackingError;

    return {
      timeEntries: timeEntries || [],
      timeTracking: timeTracking || []
    };
  },

  async stopAllActiveTimers(userId: string): Promise<void> {
    const endTime = new Date().toISOString();

    // Detener todos los time entries activos
    await supabase
      .from('time_entries')
      .update({ end_time: endTime })
      .eq('user_id', userId)
      .is('end_time', null);

    // Detener todos los time tracking activos
    await supabase
      .from('time_tracking')
      .update({ end_time: endTime })
      .eq('user_id', userId)
      .is('end_time', null);
  },

  async addManualTime(todoId: string, userId: string, hours: number, minutes: number, description: string, date: string): Promise<TimeTracking> {
    // Validar que el usuario existe
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (userError || !userExists) {
      throw new Error('El usuario especificado no existe o no está activo');
    }

    // Validar que el TODO existe
    const { data: todoExists, error: todoError } = await supabase
      .from('todos')
      .select('id')
      .eq('id', todoId)
      .single();

    if (todoError || !todoExists) {
      throw new Error('El TODO especificado no existe');
    }

    const totalSeconds = (hours * 3600) + (minutes * 60);
    const startTime = `${date}T09:00:00.000Z`; // Hora fija para tiempo manual
    const endTime = new Date(new Date(startTime).getTime() + (totalSeconds * 1000)).toISOString();

    const { data, error } = await supabase
      .from('time_tracking')
      .insert({
        todo_id: todoId,
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: totalSeconds,
        description: description || 'Tiempo manual'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error agregando tiempo manual:', error);
      throw new Error(error.message || 'Error al agregar tiempo manual');
    }
    return data;
  },

  async deleteTimeEntry(id: string, type: 'case' | 'todo'): Promise<void> {
    const table = type === 'case' ? 'time_entries' : 'time_tracking';

    // Obtener los datos antes de eliminar para auditoría
    const { data: timeEntryToDelete, error: getTimeError } = await supabase
      .from(table)
      .select(`
        *,
        ${type === 'case' ? 'cases(case_number, description)' : 'todos(title, description)'},
        users(name, email)
      `)
      .eq('id', id)
      .single();

    if (getTimeError || !timeEntryToDelete) {
      throw new Error(`El registro de tiempo especificado no existe`);
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Registrar la eliminación en el log de auditoría
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const relatedItem = type === 'case' 
        ? timeEntryToDelete.cases?.case_number 
        : timeEntryToDelete.todos?.title;
      
      await auditService.createAuditLog({
        table_name: table,
        operation: 'DELETE',
        record_id: id,
        old_data: timeEntryToDelete,
        user_id: currentUser.id || 'unknown',
        description: `Registro de tiempo eliminado del ${type === 'case' ? 'caso' : 'TODO'}: ${relatedItem} - Usuario: ${timeEntryToDelete.users?.name}`
      });
    } catch (auditError) {
      console.error('Error registrando auditoría:', auditError);
    }
  }
};

// Servicio de Reportes
export const reportService = {
  async getCaseReport(startDate: string, endDate: string, userId?: string, isAdmin?: boolean): Promise<any> {
    let query = supabase
      .from('cases_detailed')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Si no es admin, filtrar solo por el usuario actual
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getUserReport(startDate: string, endDate: string, userId?: string, isAdmin?: boolean): Promise<any> {
    let query = supabase
      .from('user_time_summary')
      .select('*');
    
    // Si no es admin, filtrar solo por el usuario actual
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getTimeReport(startDate: string, endDate: string, userId?: string, isAdmin?: boolean): Promise<any> {
    let timeEntriesQuery = supabase
      .from('time_entries')
      .select(`
        *,
        cases (
          case_number,
          description
        ),
        users (
          name,
          email
        )
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    let timeTrackingQuery = supabase
      .from('time_tracking')
      .select(`
        *,
        todos (
          title,
          description
        ),
        users (
          name,
          email
        )
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    // Si no es admin, filtrar solo por el usuario actual
    if (!isAdmin && userId) {
      timeEntriesQuery = timeEntriesQuery.eq('user_id', userId);
      timeTrackingQuery = timeTrackingQuery.eq('user_id', userId);
    }

    const { data: timeEntries, error: timeError } = await timeEntriesQuery;
    if (timeError) throw timeError;

    const { data: timeTracking, error: trackingError } = await timeTrackingQuery;
    if (trackingError) throw trackingError;

    return {
      time_entries: timeEntries || [],
      time_tracking: timeTracking || []
    };
  }
};
