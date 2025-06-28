import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id?: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  record_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  user_id: string;
  timestamp?: string;
  ip_address?: string;
  user_agent?: string;
  description?: string;
}

export interface AuditQuery {
  table_name?: string;
  operation?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  record_id?: string;
  limit?: number;
  offset?: number;
}

class AuditService {
  // Crear entrada de auditoría
  async createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Error creating audit log:', error);
        // No lanzar error para evitar afectar la operación principal
      }
    } catch (error) {
      console.error('Error in audit service:', error);
    }
  }

  // Obtener logs de auditoría
  async getAuditLogs(query: AuditQuery = {}): Promise<{
    data: AuditLogEntry[];
    count: number;
  }> {
    try {
      let queryBuilder = supabase
        .from('audit_logs')
        .select(`
          *,
          users!inner(name, email)
        `, { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Aplicar filtros
      if (query.table_name) {
        queryBuilder = queryBuilder.eq('table_name', query.table_name);
      }

      if (query.operation) {
        queryBuilder = queryBuilder.eq('operation', query.operation);
      }

      if (query.user_id) {
        queryBuilder = queryBuilder.eq('user_id', query.user_id);
      }

      if (query.record_id) {
        queryBuilder = queryBuilder.eq('record_id', query.record_id);
      }

      if (query.date_from) {
        queryBuilder = queryBuilder.gte('timestamp', query.date_from);
      }

      if (query.date_to) {
        queryBuilder = queryBuilder.lte('timestamp', query.date_to);
      }

      // Paginación
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, (query.offset + (query.limit || 50)) - 1);
      }

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], count: 0 };
    }
  }

  // Obtener estadísticas de auditoría
  async getAuditStats(days: number = 30): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByTable: Record<string, number>;
    operationsByUser: Record<string, number>;
    operationsByDay: Record<string, number>;
  }> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          operation,
          table_name,
          user_id,
          timestamp,
          users!inner(name)
        `)
        .gte('timestamp', dateFrom.toISOString());

      if (error) throw error;

      const stats = {
        totalOperations: data.length,
        operationsByType: {} as Record<string, number>,
        operationsByTable: {} as Record<string, number>,
        operationsByUser: {} as Record<string, number>,
        operationsByDay: {} as Record<string, number>,
      };

      data.forEach((log: any) => {
        // Por tipo de operación
        stats.operationsByType[log.operation] = 
          (stats.operationsByType[log.operation] || 0) + 1;

        // Por tabla
        stats.operationsByTable[log.table_name] = 
          (stats.operationsByTable[log.table_name] || 0) + 1;

        // Por usuario
        const userName = log.users?.name || 'Usuario desconocido';
        stats.operationsByUser[userName] = 
          (stats.operationsByUser[userName] || 0) + 1;

        // Por día
        const day = new Date(log.timestamp).toISOString().split('T')[0];
        stats.operationsByDay[day] = 
          (stats.operationsByDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        totalOperations: 0,
        operationsByType: {},
        operationsByTable: {},
        operationsByUser: {},
        operationsByDay: {},
      };
    }
  }

  // Obtener IP del cliente (aproximada)
  private async getClientIP(): Promise<string> {
    try {
      // En producción se podría usar un servicio como ipapi.co
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Métodos de conveniencia para diferentes operaciones
  async logCaseOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    caseId: string,
    userId: string,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<void> {
    await this.createAuditLog({
      table_name: 'cases',
      operation,
      record_id: caseId,
      old_data: oldData,
      new_data: newData,
      user_id: userId,
      description,
    });
  }

  async logTodoOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    todoId: string,
    userId: string,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<void> {
    await this.createAuditLog({
      table_name: 'todos',
      operation,
      record_id: todoId,
      old_data: oldData,
      new_data: newData,
      user_id: userId,
      description,
    });
  }

  async logUserOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    targetUserId: string,
    performedByUserId: string,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<void> {
    await this.createAuditLog({
      table_name: 'users',
      operation,
      record_id: targetUserId,
      old_data: oldData,
      new_data: newData,
      user_id: performedByUserId,
      description,
    });
  }

  async logTimeTrackingOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    timeEntryId: string,
    userId: string,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<void> {
    await this.createAuditLog({
      table_name: 'time_tracking',
      operation,
      record_id: timeEntryId,
      old_data: oldData,
      new_data: newData,
      user_id: userId,
      description,
    });
  }

  // Limpiar logs antiguos (para mantenimiento)
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      return 0;
    }
  }

  // Exportar logs a CSV
  async exportAuditLogs(query: AuditQuery = {}): Promise<string> {
    try {
      const { data } = await this.getAuditLogs({ ...query, limit: 10000 });
      
      const headers = [
        'Timestamp',
        'Usuario',
        'Tabla',
        'Operación',
        'ID Registro',
        'Descripción',
        'IP',
      ];

      const csvContent = [
        headers.join(','),
        ...data.map((log: any) => [
          new Date(log.timestamp).toLocaleString(),
          log.users?.name || 'Desconocido',
          log.table_name,
          log.operation,
          log.record_id,
          `"${log.description || ''}"`,
          log.ip_address || '',
        ].join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return '';
    }
  }
}

export const auditService = new AuditService();

// Hook para usar auditoría en componentes
export const useAuditLogger = () => {
  const logAction = async (
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    userId: string,
    description?: string,
    oldData?: any,
    newData?: any
  ) => {
    await auditService.createAuditLog({
      table_name: table,
      operation,
      record_id: recordId,
      user_id: userId,
      description,
      old_data: oldData,
      new_data: newData,
    });
  };

  return { logAction };
};
