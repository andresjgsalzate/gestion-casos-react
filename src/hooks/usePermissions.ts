import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = (module: string, action: string): boolean => {
    if (!user || !user.roles) return false;
    
    // Admin siempre tiene todos los permisos
    if (user.roles.name === 'Administrador' || user.roles.name === 'admin') return true;
    
    // Verificar permisos específicos del rol
    const rolePermissions = user.roles.role_permissions || [];
    
    return rolePermissions.some((rolePermission: any) => {
      const permission = rolePermission.permissions;
      if (!permission) return false;
      
      // Verificar coincidencia exacta de módulo y acción
      return permission.module === module && permission.action === action;
    });
  };

  const canView = (module: string) => hasPermission(module, 'read');
  const canCreate = (module: string) => hasPermission(module, 'create');
  const canUpdate = (module: string) => hasPermission(module, 'update');
  const canDelete = (module: string) => hasPermission(module, 'delete');

  // Permisos específicos por módulo
  const permissions = {
    // Casos
    cases: {
      view: canView('cases'),
      create: canCreate('cases'),
      edit: canUpdate('cases'),
      delete: canDelete('cases'),
      assign: hasPermission('cases', 'assign'),
      classification: hasPermission('cases', 'classification'),
    },
    
    // TODOs
    todos: {
      view: canView('todos'),
      create: canCreate('todos'),
      edit: canUpdate('todos'),
      delete: canDelete('todos'),
      assign: hasPermission('todos', 'assign'),
      timer: hasPermission('time', 'create'),
    },
    
    // Administración
    admin: {
      users: canView('users'),
      roles: canView('roles'),
      permissions: canView('permissions'),
      applications: canView('applications'),
      origins: canView('origins'),
      priorities: canView('priorities'),
    },
    
    // Reportes
    reports: {
      view: canView('reports'),
      export: hasPermission('reports', 'export'),
      advanced: hasPermission('reports', 'advanced'),
    },
  };

  return {
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    permissions,
    isAdmin: user?.roles?.name === 'Administrador' || user?.roles?.name === 'admin',
    isSupervisor: user?.roles?.name === 'Supervisor' || user?.roles?.name === 'supervisor',
    isUser: user?.roles?.name === 'Usuario' || user?.roles?.name === 'user',
  };
};
