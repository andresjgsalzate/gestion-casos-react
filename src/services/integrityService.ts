import { supabase } from '../lib/supabase';

export interface IntegrityReport {
  users: {
    total: number;
    active: number;
    withInvalidRoles: number;
  };
  cases: {
    total: number;
    withInvalidUser: number;
    withInvalidApplication: number;
    withInvalidOrigin: number;
    withInvalidPriority: number;
  };
  todos: {
    total: number;
    withInvalidAssignedUser: number;
    withInvalidCreator: number;
    withInvalidPriority: number;
    withInvalidCase: number;
  };
  referenceData: {
    roles: number;
    applications: number;
    origins: number;
    priorities: number;
  };
}

export const integrityService = {
  async checkIntegrity(): Promise<IntegrityReport> {
    try {
      // Verificar usuarios
      const { data: usersCheck, error: usersError } = await supabase
        .from('users')
        .select('id, is_active, role_id');
      
      if (usersError) throw usersError;

      const { data: rolesCheck, error: rolesError } = await supabase
        .from('roles')
        .select('id');
      
      if (rolesError) throw rolesError;

      const activeUsers = usersCheck?.filter(u => u.is_active).length || 0;
      const usersWithInvalidRoles = usersCheck?.filter(u => 
        !rolesCheck?.some(r => r.id === u.role_id)
      ).length || 0;

      // Verificar casos
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(`
          id,
          user_id,
          application_id,
          origin_id,
          priority_id,
          users!inner(id),
          applications(id),
          origins(id),
          priorities(id)
        `);
      
      if (casesError) throw casesError;

      // Verificar TODOs
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select(`
          id,
          assigned_to,
          created_by,
          priority_id,
          case_id,
          assigned_user:users!assigned_to(id),
          creator:users!created_by(id),
          priority:priorities(id),
          case:cases(id)
        `);
      
      if (todosError) throw todosError;

      // Contar datos de referencia
      const { data: applications } = await supabase.from('applications').select('id');
      const { data: origins } = await supabase.from('origins').select('id');
      const { data: priorities } = await supabase.from('priorities').select('id');

      return {
        users: {
          total: usersCheck?.length || 0,
          active: activeUsers,
          withInvalidRoles: usersWithInvalidRoles
        },
        cases: {
          total: casesData?.length || 0,
          withInvalidUser: 0, // Los casos sin usuarios válidos no aparecerían en la consulta
          withInvalidApplication: casesData?.filter(c => c.application_id && !c.applications).length || 0,
          withInvalidOrigin: casesData?.filter(c => c.origin_id && !c.origins).length || 0,
          withInvalidPriority: casesData?.filter(c => c.priority_id && !c.priorities).length || 0
        },
        todos: {
          total: todosData?.length || 0,
          withInvalidAssignedUser: todosData?.filter(t => t.assigned_to && !t.assigned_user).length || 0,
          withInvalidCreator: todosData?.filter(t => t.created_by && !t.creator).length || 0,
          withInvalidPriority: todosData?.filter(t => t.priority_id && !t.priority).length || 0,
          withInvalidCase: todosData?.filter(t => t.case_id && !t.case).length || 0
        },
        referenceData: {
          roles: rolesCheck?.length || 0,
          applications: applications?.length || 0,
          origins: origins?.length || 0,
          priorities: priorities?.length || 0
        }
      };
    } catch (error) {
      console.error('Error checking integrity:', error);
      throw new Error('Error al verificar la integridad de la base de datos');
    }
  },

  async validateUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  async validateApplicationExists(applicationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('id', applicationId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  async validateOriginExists(originId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('origins')
        .select('id')
        .eq('id', originId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  async validatePriorityExists(priorityId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', priorityId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  },

  async validateCaseExists(caseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id')
        .eq('id', caseId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }
};

export default integrityService;
