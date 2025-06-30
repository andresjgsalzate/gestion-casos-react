import { supabase } from '../lib/supabase';
import { auditService } from './auditService';
import type {
  ArchivedCase,
  ArchivedTodo,
  ArchivePolicy,
  ArchiveOperationLog,
  ArchiveStats,
  ArchiveFilters,
  ArchiveSearchResult,
  ArchiveSettings,
  ArchiveReasonType,
  ArchiveOperationType
} from '../types';

/**
 * Servicio para gestionar el módulo de archivo
 * Maneja casos y TODOs archivados, políticas de retención y operaciones relacionadas
 */
export class ArchiveService {

  /**
   * Obtener el usuario actual autenticado desde localStorage
   */
  private static getCurrentUser() {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user && user.id && user.is_active) {
          return user;
        }
      }
    } catch (error) {
      console.error('Error parsing current user from localStorage:', error);
    }
    return null;
  }
  
  // ===============================
  // OPERACIONES DE CASOS
  // ===============================
  
  /**
   * Archivar un caso manualmente
   */
  static async archiveCase(
    caseId: string,
    reason: ArchiveReasonType = 'MANUAL',
    reasonText?: string,
    retentionDays: number = 2555
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener datos del caso antes de archivar para auditoría
      const { data: caseData, error: getCaseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (getCaseError) {
        console.error('Error obteniendo datos del caso:', getCaseError);
        return { success: false, error: 'Error obteniendo datos del caso' };
      }

      const { data, error } = await supabase.rpc('archive_case', {
        p_case_id: caseId,
        p_user_id: user.id,
        p_reason: reason,
        p_reason_text: reasonText,
        p_retention_days: retentionDays
      });

      if (error) {
        console.error('Error archivando caso:', error);
        return { success: false, error: error.message };
      }

      // Registrar en auditoría
      try {
        await auditService.createAuditLog({
          table_name: 'cases',
          operation: 'DELETE', // El archivo se considera como eliminación lógica
          record_id: caseId,
          old_data: caseData,
          new_data: {
            status: 'ARCHIVED',
            archive_reason: reason,
            archive_reason_text: reasonText,
            archived_by: user.id,
            archived_at: new Date().toISOString()
          },
          user_id: user.id,
          description: `Caso archivado: ${reason}${reasonText ? ` - ${reasonText}` : ''}`
        });
      } catch (auditError) {
        console.error('Error registrando auditoría de archivo:', auditError);
        // No fallar la operación por error de auditoría
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en archiveCase:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Restaurar un caso archivado
   */
  static async restoreCase(
    archivedCaseId: string,
    restoreReason: string = 'Reactivación solicitada'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener datos del caso archivado antes de restaurar para auditoría
      const { data: archivedData, error: getArchivedError } = await supabase
        .from('archived_cases')
        .select('*')
        .eq('id', archivedCaseId)
        .single();

      if (getArchivedError) {
        console.error('Error obteniendo datos del caso archivado:', getArchivedError);
        return { success: false, error: 'Error obteniendo datos del caso archivado' };
      }

      const { data, error } = await supabase.rpc('restore_case', {
        p_archived_case_id: archivedCaseId,
        p_user_id: user.id,
        p_restore_reason: restoreReason
      });

      if (error) {
        console.error('Error restaurando caso:', error);
        return { success: false, error: error.message };
      }

      // Registrar en auditoría
      try {
        const originalCaseId = archivedData.original_case_id || archivedData.case_data?.id;
        await auditService.createAuditLog({
          table_name: 'cases',
          operation: 'INSERT', // La restauración se considera como inserción
          record_id: originalCaseId || archivedCaseId,
          old_data: {
            status: 'ARCHIVED',
            archived_at: archivedData.archived_at,
            archive_reason: archivedData.archive_reason
          },
          new_data: {
            ...archivedData.case_data,
            status: 'PENDIENTE',
            restored_by: user.id,
            restored_at: new Date().toISOString(),
            restore_reason: restoreReason
          },
          user_id: user.id,
          description: `Caso restaurado desde archivo: ${restoreReason}`
        });
      } catch (auditError) {
        console.error('Error registrando auditoría de restauración:', auditError);
        // No fallar la operación por error de auditoría
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en restoreCase:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener casos archivados con filtros
   */
  static async getArchivedCases(
    filters: ArchiveFilters = {}
  ): Promise<{ success: boolean; data?: ArchivedCase[]; error?: string; count?: number }> {
    try {
      let query = supabase
        .from('archived_cases')
        .select(`
          *,
          archived_by_user:users!archived_cases_archived_by_fkey(id, name, email)
        `);

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('archived_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('archived_at', filters.endDate);
      }
      if (filters.archivedBy) {
        query = query.eq('archived_by', filters.archivedBy);
      }
      if (filters.archiveReason) {
        query = query.eq('archive_reason', filters.archiveReason);
      }
      if (filters.retentionStatus) {
        query = query.eq('retention_status', filters.retentionStatus);
      }
      if (filters.searchQuery) {
        query = query.textSearch('search_vector', filters.searchQuery);
      }
      if (filters.isLegalHold !== undefined) {
        query = query.eq('is_legal_hold', filters.isLegalHold);
      }

      // Paginación
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to).order('archived_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error obteniendo casos archivados:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error en getArchivedCases:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // OPERACIONES DE TODOS
  // ===============================

  /**
   * Archivar un TODO manualmente
   */
  static async archiveTodo(
    todoId: string,
    reason: ArchiveReasonType = 'MANUAL',
    reasonText?: string,
    retentionDays: number = 2555
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener datos del TODO antes de archivar para auditoría
      const { data: todoData, error: getTodoError } = await supabase
        .from('todos')
        .select('*')
        .eq('id', todoId)
        .single();

      if (getTodoError) {
        console.error('Error obteniendo datos del TODO:', getTodoError);
        return { success: false, error: 'Error obteniendo datos del TODO' };
      }

      const { data, error } = await supabase.rpc('archive_todo', {
        p_todo_id: todoId,
        p_user_id: user.id,
        p_reason: reason,
        p_reason_text: reasonText,
        p_retention_days: retentionDays
      });

      if (error) {
        console.error('Error archivando TODO:', error);
        return { success: false, error: error.message };
      }

      // Registrar en auditoría
      try {
        await auditService.createAuditLog({
          table_name: 'todos',
          operation: 'DELETE', // El archivo se considera como eliminación lógica
          record_id: todoId,
          old_data: todoData,
          new_data: {
            status: 'ARCHIVED',
            archive_reason: reason,
            archive_reason_text: reasonText,
            archived_by: user.id,
            archived_at: new Date().toISOString()
          },
          user_id: user.id,
          description: `TODO archivado: ${reason}${reasonText ? ` - ${reasonText}` : ''}`
        });
      } catch (auditError) {
        console.error('Error registrando auditoría de archivo:', auditError);
        // No fallar la operación por error de auditoría
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en archiveTodo:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Restaurar un TODO archivado
   */
  static async restoreTodo(
    archivedTodoId: string,
    restoreReason: string = 'Reactivación solicitada'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener datos del TODO archivado antes de restaurar para auditoría
      const { data: archivedData, error: getArchivedError } = await supabase
        .from('archived_todos')
        .select('*')
        .eq('id', archivedTodoId)
        .single();

      if (getArchivedError) {
        console.error('Error obteniendo datos del TODO archivado:', getArchivedError);
        return { success: false, error: 'Error obteniendo datos del TODO archivado' };
      }

      const { data, error } = await supabase.rpc('restore_todo', {
        p_archived_todo_id: archivedTodoId,
        p_user_id: user.id,
        p_restore_reason: restoreReason
      });

      if (error) {
        console.error('Error restaurando TODO:', error);
        return { success: false, error: error.message };
      }

      // Registrar en auditoría
      try {
        const originalTodoId = archivedData.original_todo_id || archivedData.todo_data?.id;
        await auditService.createAuditLog({
          table_name: 'todos',
          operation: 'INSERT', // La restauración se considera como inserción
          record_id: originalTodoId || archivedTodoId,
          old_data: {
            status: 'ARCHIVED',
            archived_at: archivedData.archived_at,
            archive_reason: archivedData.archive_reason
          },
          new_data: {
            ...archivedData.todo_data,
            status: 'PENDING',
            restored_by: user.id,
            restored_at: new Date().toISOString(),
            restore_reason: restoreReason
          },
          user_id: user.id,
          description: `TODO restaurado desde archivo: ${restoreReason}`
        });
      } catch (auditError) {
        console.error('Error registrando auditoría de restauración:', auditError);
        // No fallar la operación por error de auditoría
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en restoreTodo:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener TODOs archivados con filtros
   */
  static async getArchivedTodos(
    filters: ArchiveFilters = {}
  ): Promise<{ success: boolean; data?: ArchivedTodo[]; error?: string; count?: number }> {
    try {
      let query = supabase
        .from('archived_todos')
        .select(`
          *,
          archived_by_user:users!archived_todos_archived_by_fkey(id, name, email),
          archived_case:archived_cases(id, case_number)
        `);

      // Aplicar filtros similares a los casos
      if (filters.startDate) {
        query = query.gte('archived_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('archived_at', filters.endDate);
      }
      if (filters.archivedBy) {
        query = query.eq('archived_by', filters.archivedBy);
      }
      if (filters.archiveReason) {
        query = query.eq('archive_reason', filters.archiveReason);
      }
      if (filters.retentionStatus) {
        query = query.eq('retention_status', filters.retentionStatus);
      }
      if (filters.searchQuery) {
        query = query.textSearch('search_vector', filters.searchQuery);
      }
      if (filters.isLegalHold !== undefined) {
        query = query.eq('is_legal_hold', filters.isLegalHold);
      }

      // Paginación
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to).order('archived_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error obteniendo TODOs archivados:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error en getArchivedTodos:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // ESTADÍSTICAS Y BÚSQUEDA
  // ===============================

  /**
   * Obtener estadísticas del archivo
   */
  static async getArchiveStats(): Promise<{ success: boolean; data?: ArchiveStats; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_archive_stats');

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || {} };
    } catch (error) {
      console.error('Error en getArchiveStats:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Buscar en archivos
   */
  static async searchArchive(
    query: string,
    itemType?: 'case' | 'todo',
    limit: number = 20
  ): Promise<{ success: boolean; data?: ArchiveSearchResult[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('search_archive', {
        p_search_query: query,
        p_item_type: itemType,
        p_limit: limit
      });

      if (error) {
        console.error('Error en búsqueda de archivo:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error en searchArchive:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // POLÍTICAS DE ARCHIVO
  // ===============================

  /**
   * Obtener políticas de archivo
   */
  static async getArchivePolicies(): Promise<{ success: boolean; data?: ArchivePolicy[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('archive_policies')
        .select(`
          *,
          created_by_user:users!archive_policies_created_by_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo políticas:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error en getArchivePolicies:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Crear nueva política de archivo
   */
  static async createArchivePolicy(
    policy: Omit<ArchivePolicy, 'id' | 'created_by' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: ArchivePolicy; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const { data, error } = await supabase
        .from('archive_policies')
        .insert({
          ...policy,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando política:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en createArchivePolicy:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Actualizar una política de archivo
   */
  static async updateArchivePolicy(
    policyId: string,
    policyData: Partial<ArchivePolicy>
  ): Promise<{ success: boolean; data?: ArchivePolicy; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const { data, error } = await supabase
        .from('archive_policies')
        .update({
          ...policyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', policyId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando política:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en updateArchivePolicy:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Eliminar una política de archivo
   */
  static async deleteArchivePolicy(
    policyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const { error } = await supabase
        .from('archive_policies')
        .delete()
        .eq('id', policyId);

      if (error) {
        console.error('Error eliminando política:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error en deleteArchivePolicy:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // OPERACIONES EN LOTE
  // ===============================

  /**
   * Archivar múltiples casos en lote
   */
  static async bulkArchiveCases(
    caseIds: string[],
    reason: ArchiveReasonType = 'BULK_OPERATION',
    reasonText?: string,
    retentionDays: number = 2555
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const { data, error } = await supabase.rpc('bulk_archive_cases', {
        p_case_ids: caseIds,
        p_user_id: user.id,
        p_reason: reason,
        p_reason_text: reasonText,
        p_retention_days: retentionDays
      });

      if (error) {
        console.error('Error en archivado en lote:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en bulkArchiveCases:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // GESTIÓN DE RETENCIÓN
  // ===============================

  /**
   * Actualizar estado de retención
   */
  static async updateRetentionStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_retention_status');

      if (error) {
        console.error('Error actualizando estado de retención:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en updateRetentionStatus:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Eliminar permanentemente elementos expirados
   */
  static async permanentDelete(
    itemType: 'case' | 'todo',
    itemIds: string[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const { data, error } = await supabase.rpc('permanent_delete_items', {
        p_item_type: itemType,
        p_item_ids: itemIds,
        p_user_id: user.id
      });

      if (error) {
        console.error('Error en eliminación permanente:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error en permanentDelete:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // LOGS Y AUDITORÍA
  // ===============================

  /**
   * Obtener logs de operaciones de archivo
   */
  static async getArchiveLogs(
    filters: {
      startDate?: string;
      endDate?: string;
      operationType?: ArchiveOperationType;
      itemType?: 'CASE' | 'TODO';
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ success: boolean; data?: ArchiveOperationLog[]; error?: string; count?: number }> {
    try {
      let query = supabase
        .from('archive_operations_log')
        .select(`
          *,
          performed_by_user:users!archive_operations_log_performed_by_fkey(id, name, email)
        `);

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('performed_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('performed_at', filters.endDate);
      }
      if (filters.operationType) {
        query = query.eq('operation_type', filters.operationType);
      }
      if (filters.itemType) {
        query = query.eq('item_type', filters.itemType);
      }
      if (filters.userId) {
        query = query.eq('performed_by', filters.userId);
      }

      // Paginación
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1).order('performed_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error obteniendo logs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error en getArchiveLogs:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // CONFIGURACIÓN Y PERMISOS
  // ===============================

  /**
   * Verificar permisos de archivo del usuario actual
   */
  static async checkArchivePermissions(): Promise<{
    canArchive: boolean;
    canRestore: boolean;
    canDelete: boolean;
    canViewStats: boolean;
    canManagePolicies: boolean;
  }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return {
          canArchive: false,
          canRestore: false,
          canDelete: false,
          canViewStats: false,
          canManagePolicies: false
        };
      }

      const { data, error } = await supabase.rpc('check_archive_permissions', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error verificando permisos:', error);
        return {
          canArchive: false,
          canRestore: false,
          canDelete: false,
          canViewStats: false,
          canManagePolicies: false
        };
      }

      return data || {
        canArchive: false,
        canRestore: false,
        canDelete: false,
        canViewStats: false,
        canManagePolicies: false
      };
    } catch (error) {
      console.error('Error en checkArchivePermissions:', error);
      return {
        canArchive: false,
        canRestore: false,
        canDelete: false,
        canViewStats: false,
        canManagePolicies: false
      };
    }
  }

  /**
   * Obtener configuración del módulo de archivo
   */
  static async getArchiveSettings(): Promise<{ success: boolean; data?: ArchiveSettings; error?: string }> {
    try {
      // Para este ejemplo, devolvemos configuración por defecto
      // En un sistema real, esto vendría de una tabla de configuración
      const defaultSettings: ArchiveSettings = {
        autoArchiveEnabled: true,
        defaultRetentionDays: 2555, // ~7 años
        warningDaysBeforeExpiry: 30,
        allowUserArchive: true,
        allowUserRestore: true,
        requireReasonForArchive: true,
        requireReasonForRestore: false,
        enableNotifications: true,
        enableLegalHold: true,
        maxRetentionDays: 3650, // 10 años
        bulkOperationLimit: 100
      };

      return { success: true, data: defaultSettings };
    } catch (error) {
      console.error('Error en getArchiveSettings:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Actualizar configuraciones del archivo
   */
  static async updateArchiveSettings(
    settings: ArchiveSettings
  ): Promise<{ success: boolean; data?: ArchiveSettings; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Por ahora, devolver éxito ya que las configuraciones son globales
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error en updateArchiveSettings:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===============================
  // MÉTODOS AUXILIARES PRIVADOS
  // ===============================

  /**
   * Registrar operación en el log de auditoría
   */
  private static async logOperation(
    operationType: ArchiveOperationType,
    itemType: 'CASE' | 'TODO',
    itemId: string,
    originalItemId?: string,
    reason?: string
  ): Promise<void> {
    try {
      const user = this.getCurrentUser();
      
      await supabase
        .from('archive_operations_log')
        .insert({
          operation_type: operationType,
          item_type: itemType,
          item_id: itemId,
          original_item_id: originalItemId,
          performed_by: user?.id,
          reason: reason,
          operation_data: {
            timestamp: new Date().toISOString(),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
          }
        });
    } catch (error) {
      console.error('Error al registrar operación:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }
}
